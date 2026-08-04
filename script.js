import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x010a15, 0.001);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.z = 400;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x010a15, 1);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.3;
bloomPass.strength = 1.2; 
bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 5000+ Ulduz
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 5000;
const posArray = new Float32Array(starsCount * 3);
for(let i=0; i < starsCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 2000;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starsMaterial = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, transparent: true, opacity: 0.8 });
const starMesh = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starMesh);

// Ay
const moonGeometry = new THREE.SphereGeometry(45, 64, 64);
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(0, 350, -400);
scene.add(moon);

// Fişəng sistemi
let fireworks = [];
const createFirework = (customX, customY, customZ) => {
    const color = new THREE.Color().setHSL(Math.random(), 1, 0.7);
    const geometry = new THREE.BufferGeometry();
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    const originX = customX !== undefined ? customX : (Math.random() - 0.5) * 500;
    const originY = customY !== undefined ? customY : (Math.random() - 0.5) * 300 + 100;
    const originZ = customZ !== undefined ? customZ : (Math.random() - 0.5) * 200 - 150;

    for(let i=0; i<particleCount; i++) {
        positions[i*3] = originX;
        positions[i*3+1] = originY;
        positions[i*3+2] = originZ;
        
        const phi = Math.acos( -1 + ( 2 * i ) / particleCount );
        const theta = Math.sqrt( particleCount * Math.PI ) * phi;
        const velocity = 2.5 + Math.random() * 2.5;
        velocities.push({
            x: velocity * Math.cos(theta) * Math.sin(phi),
            y: velocity * Math.sin(theta) * Math.sin(phi),
            z: velocity * Math.cos(phi)
        });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 3.5, color: color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    fireworks.push({ points, velocities, life: 1.0 });
};

// 4. İNTERAKTİV FİŞƏNG (Ekranın hər hansı yerinə toxunduqda/kliklədikdə orada fişəng partlayır)
window.addEventListener('click', (e) => {
    if(e.target.id === 'music-control-btn') return;
    
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    
    const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = 300;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    
    createFirework(pos.x, pos.y, pos.z);
});

// Hissəciklər
function createTexture(text) {
    const tCanvas = document.createElement('canvas');
    tCanvas.width = 64; tCanvas.height = 64;
    const ctx = tCanvas.getContext('2d');
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    return new THREE.CanvasTexture(tCanvas);
}
const sakuraTexture = createTexture('🌸');
const sparkleTexture = createTexture('✨');

const createFloatingParticles = (texture, count, size) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count*3; i+=3) {
        pos[i] = (Math.random() - 0.5) * 800;
        pos[i+1] = Math.random() * 800 - 400;
        pos[i+2] = (Math.random() - 0.5) * 400 + 150;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: size, map: texture, transparent: true, depthWrite: false });
    const mesh = new THREE.Points(geo, mat);
    scene.add(mesh);
    return mesh;
};
const sakuras = createFloatingParticles(sakuraTexture, 80, 20);
const sparkles = createFloatingParticles(sparkleTexture, 60, 15);

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    starMesh.rotation.y = elapsedTime * 0.015;
    starMesh.rotation.x = elapsedTime * 0.005;

    const sakuraPos = sakuras.geometry.attributes.position.array;
    const sparklePos = sparkles.geometry.attributes.position.array;
    
    for(let i=1; i<sakuraPos.length; i+=3) {
        sakuraPos[i] -= 0.6;
        sakuraPos[i-1] += Math.sin(elapsedTime * 1.5 + i) * 0.25;
        if(sakuraPos[i] < -400) sakuraPos[i] = 400;
    }
    for(let i=1; i<sparklePos.length; i+=3) {
        sparklePos[i] -= 0.4;
        if(sparklePos[i] < -400) sparklePos[i] = 400;
    }
    sakuras.geometry.attributes.position.needsUpdate = true;
    sparkles.geometry.attributes.position.needsUpdate = true;

    if(Math.random() < 0.03) createFirework();
    
    for(let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        const positions = fw.points.geometry.attributes.position.array;
        for(let j=0; j<positions.length; j+=3) {
            positions[j] += fw.velocities[j/3].x;
            positions[j+1] += fw.velocities[j/3].y;
            positions[j+2] += fw.velocities[j/3].z;
            fw.velocities[j/3].y -= 0.025;
        }
        fw.points.geometry.attributes.position.needsUpdate = true;
        fw.life -= 0.012;
        fw.points.material.opacity = fw.life;
        if(fw.life <= 0) {
            scene.remove(fw.points);
            fireworks.splice(i, 1);
        }
    }
    composer.render();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Kartın hərəkəti
const card = document.getElementById('card');
document.addEventListener('mousemove', (e) => {
    const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
    card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});
document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const xAxis = (window.innerWidth / 2 - touch.clientX) / 25;
    const yAxis = (window.innerHeight / 2 - touch.clientY) / 25;
    card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

card.addEventListener('mouseenter', () => card.style.transition = 'none');
card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.8s ease';
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
});

// 2. TYPEWRITER (Ardıcıl Mətn Görünmə) Effekti
function startTypewriterEffect() {
    const paragraphs = document.querySelectorAll('.type-p');
    const signature = document.querySelector('.signature');
    
    paragraphs.forEach((p, index) => {
        setTimeout(() => {
            p.classList.add('visible');
        }, index * 900 + 300);
    });

    setTimeout(() => {
        signature.classList.add('visible');
    }, paragraphs.length * 900 + 500);
}

// 3. MUSİQİ İDARƏETMƏ DÜYMƏSİ MƏNTİQİ
const musicBtn = document.getElementById('music-control-btn');
const audio = document.getElementById('bg-music');
let isPlaying = false;

musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if(isPlaying) {
        audio.pause();
        musicBtn.textContent = '🔇';
        isPlaying = false;
    } else {
        audio.play();
        musicBtn.textContent = '🎵';
        isPlaying = true;
    }
});

// Sistem işə salınması
document.getElementById('start-screen').addEventListener('click', () => {
    document.getElementById('start-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('start-screen').style.display = 'none';
        card.classList.add('show');
        musicBtn.classList.add('show');
        startTypewriterEffect();
    }, 1000);
    
    audio.volume = 0.6;
    let playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            isPlaying = true;
            musicBtn.textContent = '🎵';
        }).catch(error => {
            console.log("Musiqi xətası:", error);
            musicBtn.textContent = '🔇';
        });
    }
    
    animate(); 
});
