/**
 * CampoPong.js
 * 
 * Base para un campo 3D en Three.js para un juego de Pong
 * Incluye suelo con líneas, paredes laterales, luz básica, gradas bien orientadas y figuras simples como espectadores
 * 
 * @author <rvivo@upv.es>, 2023
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";



// Variables de consenso
let renderer, scene, camera;
let paddleLeft, paddleRight, ball;
let controls;

let anchoCampo = 15;
let altoCampo = 25;

let derechaCampo = anchoCampo / 2;
let izquerdaCampo = -anchoCampo / 2;
let norteCampo = altoCampo / 2;
let surCampo = -altoCampo / 2;

let ballSpeed = { x: 0, z: 0 };
let scoreLeft = 0, scoreRight = 0;
let scoreDisplay, winnerMessage;
let isPlaying = false;
let paddleSpeed = 1;
let keys = {};
let paddleLeftUpdate;
let paddleLeftUpdateTimer = -1;
// Acciones
init();
loadScene();
createUI();
requestAnimationFrame(render);

document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});


function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild( renderer.domElement );

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.2, 0.4, 0.6); // Azul cielo para un fondo más agradable

    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 15, 22 );
    camera.lookAt( new THREE.Vector3(0, 0, 0) );

    // Luz
    const luz = new THREE.DirectionalLight(0xffffff, 1.0);
    luz.position.set(5, 10, 5);
    scene.add(luz);

    // Manejar redimensionado
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  // Suaviza el movimiento
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;  // No permite girar la cámara debajo del suelo
}

function loadScene()
{
    const materialLinea = new THREE.LineBasicMaterial({ color: 0xffffff });
    const materialPared = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const materialSuelo = new THREE.MeshBasicMaterial({ color: 0x005500 });

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(anchoCampo, altoCampo), materialSuelo );
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

    // Líneas del campo
    const lineas = new THREE.Group();
    const puntos = [
        new THREE.Vector3(izquerdaCampo, 0.01, 0), new THREE.Vector3(derechaCampo, 0.01, 0), // Línea central
        new THREE.Vector3(izquerdaCampo, 0.01, norteCampo), new THREE.Vector3(izquerdaCampo, 0.01, surCampo), // Borde izquierdo
        new THREE.Vector3(derechaCampo, 0.01, norteCampo), new THREE.Vector3(derechaCampo, 0.01, 10)  // Borde derecho
    ];
    for (let i = 0; i < puntos.length; i += 2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([puntos[i], puntos[i + 1]]);
        const linea = new THREE.Line(geometry, materialLinea);
        lineas.add(linea);
    }
    scene.add(lineas);

    // Paredes laterales
    let anchoPared = 0.5;
    let profundidadPared = 2;


    const paredIzq = new THREE.Mesh( new THREE.BoxGeometry(anchoPared, profundidadPared, altoCampo), materialPared );
    paredIzq.position.set(izquerdaCampo - (anchoPared / 2), 1, 0);
    scene.add(paredIzq);

    const paredDer = new THREE.Mesh( new THREE.BoxGeometry(anchoPared, profundidadPared, altoCampo), materialPared );
    paredDer.position.set(derechaCampo + (anchoPared / 2), 1, 0);
    scene.add(paredDer);

    // Gradas bien orientadas
    const materialGradas = new THREE.MeshBasicMaterial({ color: 0x444444 });

    let numeroGradas = 5;
    let altoGrada = altoCampo;
    let anchoGrada = 3;
    for (let i = 0; i < numeroGradas; i++) {
        if (i != numeroGradas - 1) {
        const gradaIzq = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 1, anchoGrada), materialGradas);
        gradaIzq.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (i * anchoGrada) , i, -0.5);
        gradaIzq.rotation.y = Math.PI / 2;
        scene.add(gradaIzq);

        const gradaDer = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 1, anchoGrada), materialGradas);
        gradaDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (i * anchoGrada) , i, -0.5);
        gradaDer.rotation.y = -Math.PI / 2;
        scene.add(gradaDer);
        }
        else {
            const gradaIzq = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 3, anchoGrada/3), materialGradas);
            gradaIzq.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (i * anchoGrada) + anchoGrada/3 , i, -0.5);
            gradaIzq.rotation.y = Math.PI / 2;
            scene.add(gradaIzq);
    
            const gradaDer = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 3, anchoGrada/3), materialGradas);
            gradaDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (i * anchoGrada) - anchoGrada/3 , i, -0.5);
            gradaDer.rotation.y = -Math.PI / 2;
            scene.add(gradaDer);
        }

    }

    // Espectadores bien distribuidos
    const materialEspectador = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    let espectadoresPorGrada = 12;

    for (let fila = 0; fila < numeroGradas - 1; fila++) {
        for (let i = -(espectadoresPorGrada / 2); i <= espectadoresPorGrada / 2; i++) {
            let cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 8), materialEspectador);
            cuerpo.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (fila * anchoGrada), fila + 0.5, i * 1.5);
            scene.add(cuerpo);

            let cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), materialEspectador);
            cabeza.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (fila * anchoGrada), fila + 1.2, i * 1.5);
            scene.add(cabeza);

            let cuerpoDer = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 8), materialEspectador);
            cuerpoDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (fila * anchoGrada), fila + 0.5, i * 1.5);
            scene.add(cuerpoDer);

            let cabezaDer = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), materialEspectador);
            cabezaDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (fila * anchoGrada), fila + 1.2, i * 1.5);
            scene.add(cabezaDer);
        }
    }


    // Porterías con redes
    const materialRed = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const porteriaIzq = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaIzq.position.set(0, 1, norteCampo);
    scene.add(porteriaIzq);

    const porteriaDer = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaDer.position.set(0, 1, surCampo);
    scene.add(porteriaDer);

    // Palas del Pong en las porterías
    const materialPala = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
    paddleLeft.position.set(0, 1, surCampo + 0.25);
    scene.add(paddleLeft);

    paddleRight = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
    paddleRight.position.set(0, 1, norteCampo - 0.25);
    scene.add(paddleRight);


    // Pelota
    const materialPelota = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), materialPelota);
    ball.position.set(0, 0.5, 0);
    scene.add(ball);
}

function createUI() {
    const container = document.getElementById('container');
    const uiDiv = document.createElement('div');
    uiDiv.style.position = 'absolute';
    uiDiv.style.top = '20px';
    uiDiv.style.left = '50%';
    uiDiv.style.transform = 'translateX(-50%)';
    uiDiv.style.fontSize = '24px';
    uiDiv.style.color = 'white';
    container.appendChild(uiDiv);

    scoreDisplay = document.createElement('div');
    scoreDisplay.textContent = '0 - 0';
    uiDiv.appendChild(scoreDisplay);

    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.style.display = 'block';
    playButton.onclick = startGame;
    playButton.style.position = "absolute";
    playButton.style.top = "10px";
    playButton.style.left = "50px";
    container.appendChild(playButton);

    winnerMessage = document.createElement('div');
    winnerMessage.style.position = 'absolute';
    winnerMessage.style.top = '150px';
    winnerMessage.style.left = '50%';
    winnerMessage.style.transform = 'translate(-50%, -50%)';
    winnerMessage.style.fontSize = '48px';
    winnerMessage.style.color = 'white';
    winnerMessage.style.display = 'none';
    container.appendChild(winnerMessage);
}


function startGame() {
    isPlaying = true;
    resetBall();
    ballSpeed.x = Math.random() > 0.5 ? 0.1 : -0.1;
    ballSpeed.z = 0.25;
    winnerMessage.style.display = 'none';
}

function resetBall() {
    ball.position.set(0, 0.5, 0);
    ballSpeed.x = 0;
    ballSpeed.z = 0;

    paddleLeft.position.set(0, 1, surCampo + 0.25);
    paddleRight.position.set(0, 1, norteCampo - 0.25);
}

function updateGame() {
    if (isPlaying) {
        ball.position.x += ballSpeed.x;
        ball.position.z += ballSpeed.z;

        if (ball.position.x <= izquerdaCampo + 0.5 || ball.position.x >= derechaCampo - 0.5) {
            ballSpeed.x *= -1;
        }

        if (ball.position.z <= surCampo + 1 &&
            ball.position.x >= paddleLeft.position.x - 2.5 &&
            ball.position.x <= paddleLeft.position.x + 2.5) {
            ballSpeed.z *= -1;
        }
        else if (ball.position.z <= surCampo + 0.75){

            scoreRight++;
            checkWin();
        }

        if (ball.position.z >= norteCampo - 1 &&
            ball.position.x >= paddleRight.position.x - 2.5 &&
            ball.position.x <= paddleRight.position.x + 2.5) {
            ballSpeed.z *= -1;
        }else if (ball.position.z >= norteCampo - 0.75){
            scoreLeft++;
            checkWin();
        }
        scoreDisplay.textContent = `${scoreLeft} - ${scoreRight}`;

        paddleLeftUpdateTimer += 1;

        if (paddleLeftUpdateTimer > 30 || paddleLeftUpdateTimer < 0) {
            paddleLeftUpdate= Math.random() > 0.5 ? paddleSpeed : -paddleSpeed;
            paddleLeftUpdateTimer= 0;
        }
    
        if (paddleLeftUpdate > 0 && paddleLeft.position.x > izquerdaCampo + 2.5) {
            paddleLeft.position.x -= paddleSpeed/4;
        }
        if (paddleLeftUpdate < 0  && paddleLeft.position.x < derechaCampo - 2.5) {
            paddleLeft.position.x += paddleSpeed/4;
        }
    }

    if (keys["ArrowLeft"] && paddleRight.position.x > izquerdaCampo + 2.5) {
        paddleRight.position.x -= paddleSpeed;
    }
    if (keys["ArrowRight"] && paddleRight.position.x < derechaCampo - 2.5) {
        paddleRight.position.x += paddleSpeed;
    }

    if (ballSpeed.z > 0){
        ballSpeed.z += 0.0025;
    }
    else if (ballSpeed.z < 0){
        ballSpeed.z -= 0.0025;
    }


}

function checkWin() {
    if (scoreLeft === 3) {
        winnerMessage.textContent = 'Has perdido...';
        gameOver();
    } else if (scoreRight === 3) {
        winnerMessage.textContent = '¡Has ganado!';
        gameOver();
    } else {
        startGame();
        
    }
}

function gameOver() {
    isPlaying = false;
    scoreLeft = 0;
    scoreRight = 0;
    winnerMessage.style.display = 'block';
}


let lastTime = 0;
const fps = 60;
const interval = 1000 / fps;

function render(time) {
    const deltaTime = time - lastTime;
    
    if (deltaTime > interval) {
        lastTime = time;

        // Llama a tu función de actualización del juego
        updateGame();
        controls.update();  // Importante para que los controles funcionen
        // Renderiza la escena
        renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
}

