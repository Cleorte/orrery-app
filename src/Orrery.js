import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import axios from 'axios';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Orrery = () => {
    const containerRef = useRef(null);
    const neos = useRef([]); // Store NEOs here for animation

    useEffect(() => {
        // Scene, Camera, and Renderer setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 0, 5); // Near the Sun
        scene.add(pointLight);

        // Load textures for Sun, Earth, and Moon
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/textures/sun_texture.jpg');
        const earthTexture = textureLoader.load('/textures/earth_texture.jpg');
        const moonTexture = textureLoader.load('/textures/moon_texture.jpg');

        // Create Earth at the center
        const earthGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(0, 0, 0); // Earth at the center
        scene.add(earth);

        // Create the Sun
        const sunGeometry = new THREE.SphereGeometry(54.5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Create the Moon
        const moonGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        scene.add(moon);

        // Camera positioning: closer to Earth
        camera.position.set(3, 1, 3);
        camera.lookAt(earth.position);

        // Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;

        // Sun's orbit radius around Earth
        const sunOrbitRadius = 150;

        // Function to calculate orbital position (elliptical orbit simplified)
        const calculateOrbitalPosition = (radius, angle) => {
            return new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
        };

        // Fetch NEO data from NASA API and position them around Earth
        const fetchNEOData = async () => {
            try {
                const response = await axios.get('https://api.nasa.gov/neo/rest/v1/neo/browse', {
                    params: {
                        api_key: 'VqYZItOVISoW107L7j09YaliQ6cVo6GlGUiPtjNi',
                        page_size: 10,
                    },
                });

                const neosData = response.data.near_earth_objects;

                // Add NEOs to the scene
                neosData.forEach((neo, index) => {
                    const neoGeometry = new THREE.SphereGeometry(0.1, 32, 32);
                    const neoMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const neoMesh = new THREE.Mesh(neoGeometry, neoMaterial);

                    // Randomize initial position around Earth (for simplicity)
                    const orbitRadius = 1.5 + Math.random(); // Vary orbit radius slightly for each NEO
                    const initialAngle = Math.random() * 2 * Math.PI; // Random starting angle
                    neoMesh.position.set(
                        orbitRadius * Math.cos(initialAngle),
                        0,
                        orbitRadius * Math.sin(initialAngle)
                    );

                    // Store the NEO with its orbit data
                    neos.current.push({
                        mesh: neoMesh,
                        orbitRadius,
                        angle: initialAngle,
                        speed: 0.01 + Math.random() * 0.01, // Random speed for each NEO
                    });

                    scene.add(neoMesh);
                });
            } catch (error) {
                console.error('Error fetching NASA data:', error);
            }
        };

        fetchNEOData();

        // Animate NEOs around Earth in the main animation loop
        const animateNEOs = () => {
            neos.current.forEach((neo) => {
                // Update angle and position for each NEO
                neo.angle += neo.speed;
                const position = calculateOrbitalPosition(neo.orbitRadius, neo.angle);
                neo.mesh.position.set(position.x, position.y, position.z);
            });
        };

        // Starfield (existing code remains the same)
        const createStarField = () => {
            const particleCount = 10000;
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount).fill(0.1);

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 1000;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
            }

            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, sizeAttenuation: true, size: 0.3 });
            const particleSystem = new THREE.Points(particles, particleMaterial);
            scene.add(particleSystem);

            const animateStars = () => {
                const positions = particles.attributes.position.array;

                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += (Math.random() - 0.5) * 0.01;
                    positions[i * 3 + 1] += (Math.random() - 0.5) * 0.01;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.01;
                    sizes[i] = Math.random() * 0.5 + 0.1;
                }

                particles.attributes.position.needsUpdate = true;
                particles.attributes.size.needsUpdate = true;
            };

            const animate = function () {
                requestAnimationFrame(animate);
                animateStars();
                earth.rotation.y += 0.01;

                const time = Date.now() * 0.0001;
                sun.position.x = sunOrbitRadius * Math.cos(time);
                sun.position.z = sunOrbitRadius * Math.sin(time);
                sun.rotation.y += 0.0005;

                const moonOrbitRadius = 0.8;
                moon.position.x = earth.position.x + moonOrbitRadius * Math.cos(time * 2);
                moon.position.z = earth.position.z + moonOrbitRadius * Math.sin(time * 2);
                moon.rotation.y += 0.000001;

                animateNEOs(); // Update NEO positions in each frame
                renderer.render(scene, camera);
            };

            animate();
        };

        createStarField();

        return () => {
            containerRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={containerRef} />;
};

export default Orrery;
