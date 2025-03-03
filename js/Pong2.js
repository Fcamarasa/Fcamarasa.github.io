/**
 * Pong2.js
 * 
 * Script para el juego del Pong 2 en Three.js
 * 
 * 
 * @author Francesc Camarasa Mestre, 2025
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";

// Variables de protocolo
let renderer, scene, camera;
let controls;
const loader = new THREE.TextureLoader();

// Variables de partes de la geometría
let suelo, cesped, paredIzq, paredDer, porteriaIzq, porteriaDer, lineas;
let paddleLeft, paddleRight, ball;
let farolas = [];
let gradas = [];
let espectadoresIzq = [];
let espectadoresDer = [];

//Variables de valores de la geometría
let anchoCampo = 15;
let altoCampo = 25;

let numeroGradas = 4;
let altoGrada = altoCampo;
let anchoGrada = 3;
let espectadoresPorGrada = 12;

let anchoPared = 0.5;
let profundidadPared = 2;

let derechaCampo = anchoCampo / 2;
let izquerdaCampo = -anchoCampo / 2;
let norteCampo = altoCampo / 2;
let surCampo = -altoCampo / 2;

let fondo = 0;

//confeti

let confettiParticles = [];
const confettiMaterial = new THREE.SpriteMaterial({
    color: 0xFFFFFF,
    map: new THREE.CanvasTexture(generateConfettiTexture()),
    blending: THREE.AdditiveBlending,
    opacity: 0.8
});

function generateConfettiTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    return canvas;
}

// Materiales
const materialMetal = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.8, roughness: 0.5 });
const bordilloMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const materialSuelo = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, // SaddleBrown
    metalness: 0.3,
    roughness: 0.9
});
const materialLinea = new THREE.LineBasicMaterial({ color: 0xffffff });
const materialCesped = new THREE.MeshStandardMaterial({ 
    color: 0x005500, 
    roughness: 0.9,
    metalness: 0.1
});
const materialPared = new THREE.MeshBasicMaterial({ color: 0x222222 });
const materialRed = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const materialPala = new THREE.MeshBasicMaterial({ color: 0xDC143C });
const materialPala2 = new THREE.MeshBasicMaterial({ color: 0x0000CD });
const materialPelota = new THREE.MeshStandardMaterial({ 
    color: 0xffa500, // Naranja
});

// Variables de UI
let scoreDisplay, winnerMessage, firstTo3Message, controlesMessage;
let playButton;

// Variables de estado
let goalSound, goalSound2;
let winSound, loseSound;
let ballSpeed = { x: 0, z: 0 };
let scoreLeft = 0, scoreRight = 0;
let keys = {};
let paddleLeftUpdate;
let paddleLeftUpdateTimer = -1;
let goalCelebration = false;
let endScene = false;
let goalscored = false;
let isCameraTransition = false;
let paddleSpeed = 1;
let isPlaying = false;
let isGameRunning = false; // Variable para rastrear el estado del juego



// Variables de cámara
let originalCameraPosition = new THREE.Vector3();
let originalCameraTarget = new THREE.Vector3();

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
    actualizarFondo(fondo)

    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 100 );
    camera.position.set(0, 20, 25);
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

    TWEEN.now = function () {
        return performance.now();
    };

    // Cargar sonido
    goalSound = new Audio('./sounds/pitbull-fireball.mp3');
    goalSound.volume = 0.5;

    goalSound2 = new Audio("./sounds/yaketi_sax.mp3");
    goalSound2.volume = 0.5; 
    
    winSound = new Audio("./sounds/mario_victory_theme.mp3");
    winSound.volume = 0.5;
    
    loseSound = new Audio("./sounds/curb_your_enthusiam.mp3"); 
    loseSound.volume = 0.5;

    // Crear controles para el "giroscopio"
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  // Suaviza el movimiento
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;  // No permite girar la cámara debajo del suelo
    
}

function actualizarFondo(num) {
    let url = './images/fondo' + num + '.jpg';
    loader.load(url, function(texture) {
        scene.background = texture;
    });
}

function loadScene()
{   
    // Suelo
    suelo = new THREE.Mesh( new THREE.BoxGeometry(anchoCampo + (numeroGradas*anchoGrada) + 30, 1, altoCampo + 12.5), materialSuelo );
    suelo.position.set(0, -0.6, 0);
    scene.add(suelo);

    // Líneas del campo
    lineas = new THREE.Group();
    const puntos = [
        new THREE.Vector3(izquerdaCampo, 0.01, 0), new THREE.Vector3(derechaCampo, 0.01, 0), // Línea central
        new THREE.Vector3(izquerdaCampo, 0.01, norteCampo), new THREE.Vector3(izquerdaCampo, 0.01, surCampo), // Borde izquierdo
        new THREE.Vector3(derechaCampo, 0.01, norteCampo), new THREE.Vector3(derechaCampo, 0.01, surCampo),  // Borde derecho
        new THREE.Vector3(derechaCampo, 0.01, norteCampo), new THREE.Vector3(izquerdaCampo, 0.01, norteCampo),
        new THREE.Vector3(izquerdaCampo, 0.01, surCampo), new THREE.Vector3(derechaCampo, 0.01, surCampo)
    ];
    for (let i = 0; i < puntos.length; i += 2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([puntos[i], puntos[i + 1]]);
        const linea = new THREE.Line(geometry, materialLinea);
        lineas.add(linea);
    }
    scene.add(lineas);

    // Campo de juego con césped
    cesped = new THREE.Mesh(
        new THREE.BoxGeometry(anchoCampo, 0.2, altoCampo),
        materialCesped
    );
    cesped.position.set(0, -0.1, 0);
    scene.add(cesped);

    // Farolas en las esquinas
    farolas = [
        crearFarola(izquerdaCampo - 2, norteCampo + 2),
        crearFarola(derechaCampo + 2, norteCampo + 2),
        crearFarola(izquerdaCampo - 2, surCampo - 2),
        crearFarola(derechaCampo + 2, surCampo - 2)
    ];
    farolas.forEach(f => scene.add(f));
    
    // Paredes laterales
    paredIzq = new THREE.Mesh( new THREE.BoxGeometry(anchoPared, profundidadPared, altoCampo), materialPared );
    paredIzq.position.set(izquerdaCampo - (anchoPared / 2), 1, 0);
    scene.add(paredIzq);

    paredDer = new THREE.Mesh( new THREE.BoxGeometry(anchoPared, profundidadPared, altoCampo), materialPared );
    paredDer.position.set(derechaCampo + (anchoPared / 2), 1, 0);
    scene.add(paredDer);

    // Gradas bien orientadas
    crearGradas(0xADD8E6, 0x4682B4, 0xFFB6C1, 0xCD5C5C);

    // Espectadores bien distribuidos
    crearEspectadores();

    // Porterías con redes
    porteriaIzq = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaIzq.position.set(0, 1, norteCampo);
    scene.add(porteriaIzq);

    porteriaDer = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaDer.position.set(0, 1, surCampo);
    scene.add(porteriaDer);

    // Palas del Pong en las porterías
    paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
    paddleLeft.position.set(0, 1, surCampo + 0.25);
    scene.add(paddleLeft);

    paddleRight = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala2);
    paddleRight.position.set(0, 1, norteCampo - 0.25);
    scene.add(paddleRight);

    // Pelota
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), materialPelota);
    ball.position.set(0, 0.5, 0);
    scene.add(ball);


}

function crearGradas(colorIzq1, colorIzq2, colorDer1, colorDer2) {
    // Limpiar gradas existentes
    gradas.forEach(g => scene.remove(g));
    gradas = [];

    const colorGradas1Izq = colorIzq1;
    const colorGradas2Izq = colorIzq2;
    const colorGradas1Der = colorDer1;
    const colorGradas2Der = colorDer2;

    let colorGradasIzq = colorGradas1Izq;
    let colorGradasDer = colorGradas1Der;

    for (let i = 0; i < numeroGradas; i++) {
        if (i % 2 === 0) {
            colorGradasIzq = colorGradas1Izq;
            colorGradasDer = colorGradas1Der;
        } else {
            colorGradasDer = colorGradas2Der;
            colorGradasIzq = colorGradas2Izq;
        }

        let gradaIzq, gradaDer;

        if (i != numeroGradas - 1) {
            altoGrada = altoCampo;
            const materialGradasIzq = new THREE.MeshBasicMaterial({ color: colorGradasIzq });
            gradaIzq = new THREE.Mesh(
                new THREE.BoxGeometry(altoGrada, 1, anchoGrada), 
                materialGradasIzq
            );
            gradaIzq.position.set(
                izquerdaCampo - (anchoGrada / 2) - 0.75 - (i * anchoGrada), 
                i, 
                -0.5
            );
            gradaIzq.rotation.y = Math.PI / 2;

            const materialGradasDer = new THREE.MeshBasicMaterial({ color: colorGradasDer });
            gradaDer = new THREE.Mesh(
                new THREE.BoxGeometry(altoGrada, 1, anchoGrada), 
                materialGradasDer
            );
            gradaDer.position.set(
                derechaCampo + (anchoGrada / 2) + 0.75 + (i * anchoGrada), 
                i, 
                -0.5
            );
            gradaDer.rotation.y = -Math.PI / 2;
        } else {
            const materialGradasIzq = new THREE.MeshBasicMaterial({ color: colorGradasIzq });
            gradaIzq = new THREE.Mesh(
                new THREE.BoxGeometry(altoGrada, 3, anchoGrada / 3), 
                materialGradasIzq
            );
            gradaIzq.position.set(
                izquerdaCampo - (anchoGrada / 2) - 0.75 - (i * anchoGrada) + anchoGrada / 3, 
                i, 
                -0.5
            );
            gradaIzq.rotation.y = Math.PI / 2;

            const materialGradasDer = new THREE.MeshBasicMaterial({ color: colorGradasDer });
            gradaDer = new THREE.Mesh(
                new THREE.BoxGeometry(altoGrada, 3, anchoGrada / 3), 
                materialGradasDer
            );
            gradaDer.position.set(
                derechaCampo + (anchoGrada / 2) + 0.75 + (i * anchoGrada) - anchoGrada / 3, 
                i, 
                -0.5
            );
            gradaDer.rotation.y = -Math.PI / 2;
        }

        gradas.push(gradaIzq);
        gradas.push(gradaDer);
        scene.add(gradaIzq);
        scene.add(gradaDer);
    }
}

// Función para crear espectadores
function crearEspectadores() {
    // Limpiar espectadores existentes
    espectadoresIzq.forEach(e => {
        scene.remove(e.cuerpo);
        scene.remove(e.cabeza);
    });
    espectadoresIzq = [];

    espectadoresDer.forEach(e => {
        scene.remove(e.cuerpo);
        scene.remove(e.cabeza);
    });
    espectadoresDer = [];

    let espectadoresPorGradaLocalVar;

    if (espectadoresPorGrada > 0.55 * altoCampo){
        espectadoresPorGradaLocalVar = Math.floor(0.55 * altoCampo);
    }else { espectadoresPorGradaLocalVar = espectadoresPorGrada; }

    function getRandomColor(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    for (let fila = 0; fila < numeroGradas - 1; fila++) {
        for (let i = -(espectadoresPorGradaLocalVar / 2); i <= espectadoresPorGradaLocalVar / 2; i++) {
            // Espectadores izquierda
            


            const rIzq = getRandomColor(0, 128);
            const gIzq = getRandomColor(0, 255);
            const bIzq = getRandomColor(128, 255);
            const colorAleatorioIzq = new THREE.Color(`rgb(${rIzq}, ${gIzq}, ${bIzq})`);
            const materialEspectador = new THREE.MeshBasicMaterial({ color: colorAleatorioIzq });
            
            let cuerpo = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 1, 8), 
                materialEspectador
            );
            let cabeza = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8), 
                materialEspectador
            );
            
            cuerpo.position.set(
                izquerdaCampo - (anchoGrada / 2) - 0.75 - (fila * anchoGrada), 
                fila + 0.5, 
                i * 1.5
            );
            cabeza.position.set(
                izquerdaCampo - (anchoGrada / 2) - 0.75 - (fila * anchoGrada), 
                fila + 1.2, 
                i * 1.5
            );

            scene.add(cuerpo);
            scene.add(cabeza);
            espectadoresIzq.push({ cuerpo, cabeza });

            // Espectadores derecha
            
    
            const rDer = getRandomColor(128, 255); // Mayor énfasis en los tonos rojos
            const gDer = getRandomColor(0, 255);
            const bDer = getRandomColor(0, 128);
            const colorAleatorioDer = new THREE.Color(`rgb(${rDer}, ${gDer}, ${bDer})`);
            const materialEspectadorDer = new THREE.MeshBasicMaterial({ color: colorAleatorioDer });

            let cuerpoDer = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 1, 8), 
                materialEspectadorDer
            );
            let cabezaDer = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8), 
                materialEspectadorDer
            );
            
            cuerpoDer.position.set(
                derechaCampo + (anchoGrada / 2) + 0.75 + (fila * anchoGrada), 
                fila + 0.5, 
                i * 1.5
            );
            cabezaDer.position.set(
                derechaCampo + (anchoGrada / 2) + 0.75 + (fila * anchoGrada), 
                fila + 1.2, 
                i * 1.5
            );

            scene.add(cuerpoDer);
            scene.add(cabezaDer);
            espectadoresDer.push({ cuerpo: cuerpoDer, cabeza: cabezaDer });
        }
    }
}


// Farolas en las esquinas
function crearFarola(x, z) {
    const grupo = new THREE.Group();
    
    // Poste
    const poste = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 8),
        materialMetal
    );
    poste.position.set(x, 4, z);
    
    // Lámpara
    const lampara = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );
    lampara.position.set(x, 8, z);
    lampara.rotation.y = Math.PI/4;
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.5),
        bordilloMaterial
    );
    base.position.set(x, 0.25, z);
    
    grupo.add(poste);
    grupo.add(lampara);
    grupo.add(base);
    
    return grupo;
}


function updateFieldGeometry() {
    
    // Actualizar suelo
    suelo.geometry.dispose();
    suelo.geometry = new THREE.BoxGeometry(
        anchoCampo + (numeroGradas*anchoGrada) + 30, 
        1, 
        altoCampo + 12.5
    );

    // Actualizar césped
    cesped.geometry.dispose();
    cesped.geometry = new THREE.BoxGeometry(anchoCampo, 0.2, altoCampo);

    // Actualizar paredes
    scene.remove(paredIzq)
    paredIzq = new THREE.Mesh( new THREE.BoxGeometry(anchoPared, profundidadPared, altoCampo), materialPared );
    paredIzq.position.set(izquerdaCampo - (anchoPared / 2), 1, 0);
    scene.add(paredIzq);

    scene.remove(paredDer)
    paredDer = new THREE.Mesh( new THREE.BoxGeometry(anchoPared, profundidadPared, altoCampo), materialPared );
    paredDer.position.set(derechaCampo + (anchoPared / 2), 1, 0);
    scene.add(paredDer);

    // Actualizar porterías
    scene.remove(porteriaIzq);
    porteriaIzq = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaIzq.position.set(0, 1, norteCampo);
    scene.add(porteriaIzq);

    scene.remove(porteriaDer);
    porteriaDer = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaDer.position.set(0, 1, surCampo);
    scene.add(porteriaDer);

    // Actualizar líneas del campo
    scene.remove(lineas);
    lineas = new THREE.Group();
    
    const puntos = [
        new THREE.Vector3(izquerdaCampo, 0.01, 0), new THREE.Vector3(derechaCampo, 0.01, 0), // Línea central
        new THREE.Vector3(izquerdaCampo, 0.01, norteCampo), new THREE.Vector3(izquerdaCampo, 0.01, surCampo), // Borde izquierdo
        new THREE.Vector3(derechaCampo, 0.01, norteCampo), new THREE.Vector3(derechaCampo, 0.01, surCampo),  // Borde derecho
        new THREE.Vector3(derechaCampo, 0.01, norteCampo), new THREE.Vector3(izquerdaCampo, 0.01, norteCampo),
        new THREE.Vector3(izquerdaCampo, 0.01, surCampo), new THREE.Vector3(derechaCampo, 0.01, surCampo)

    ];
    for (let i = 0; i < puntos.length; i += 2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([puntos[i], puntos[i + 1]]);
        const linea = new THREE.Line(geometry, materialLinea);
        lineas.add(linea);
    }
    scene.add(lineas);

    // Actualizar palas
    scene.remove(paddleLeft);
    paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
    paddleLeft.position.set(0, 1, surCampo + 0.25);
    scene.add(paddleLeft);

    scene.remove(paddleRight);
    paddleRight = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala2);
    paddleRight.position.set(0, 1, norteCampo - 0.25);
    scene.add(paddleRight);

    // Actualizar farolas
    farolas.forEach(f => scene.remove(f));
    farolas = [
        crearFarola(izquerdaCampo - 2, norteCampo + 2),
        crearFarola(derechaCampo + 2, norteCampo + 2),
        crearFarola(izquerdaCampo - 2, surCampo - 2),
        crearFarola(derechaCampo + 2, surCampo - 2)
    ];
    farolas.forEach(f => scene.add(f));

    // Actualizar gradas
    crearGradas(0xADD8E6, 0x4682B4, 0xFFB6C1, 0xCD5C5C);

    // Actualizar espectadores
    crearEspectadores();
}

function palasUpdate(side){

    if (side === 'left'){

        scene.remove(paddleLeft);
        paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala2);
        paddleLeft.position.set(0, 1, surCampo + 0.25);
        scene.add(paddleLeft);

    }
    else if (side === 'right'){
        scene.remove(paddleRight);
        paddleRight = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
        paddleRight.position.set(0, 1, norteCampo - 0.25);
        scene.add(paddleRight);

    }
    else {
        scene.remove(paddleLeft);
        paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
        paddleLeft.position.set(0, 1, surCampo + 0.25);
        scene.add(paddleLeft);
    
        scene.remove(paddleRight);
        paddleRight = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala2);
        paddleRight.position.set(0, 1, norteCampo - 0.25);
        scene.add(paddleRight);
    }
}
function createUI() {
    const container = document.getElementById('container');



    // Estilos base para los elementos comunes
    const baseButtonStyle = {
        padding: '8px 20px',
        border: 'none',
        borderRadius: '5px',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '14px',
        fontWeight: 'bold'
    };

    // Marcador mejorado
    const uiDiv = document.createElement('div');
    uiDiv.style.position = 'absolute';
    uiDiv.style.top = '20px';
    uiDiv.style.left = '50%';
    uiDiv.style.transform = 'translateX(-50%)';
    uiDiv.style.fontSize = '40px';
    uiDiv.style.color = 'white';
    uiDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    container.appendChild(uiDiv);

    scoreDisplay = document.createElement('div');
    scoreDisplay.textContent = '0 - 0';
    scoreDisplay.style.fontFamily = 'Arial, sans-serif';
    uiDiv.appendChild(scoreDisplay);

    // Mensajes informativos
    const messageContainer = document.createElement('div');
    messageContainer.style.position = 'absolute';
    messageContainer.style.top = '70px';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translateX(-50%)';
    messageContainer.style.textAlign = 'center';
    container.appendChild(messageContainer);

    firstTo3Message = document.createElement("div");
    firstTo3Message.textContent = "¡El primero que llegue a 3 goles gana!";
    firstTo3Message.style.color = '#ffd700';
    firstTo3Message.style.fontSize = '16px';
    firstTo3Message.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
    firstTo3Message.style.marginBottom = '8px';
    messageContainer.appendChild(firstTo3Message);

    controlesMessage = document.createElement("div");
    controlesMessage.textContent = "Controles: Usa las flechas ← → para mover tu pala";
    controlesMessage.style.color = '#ccc';
    controlesMessage.style.fontSize = '14px';
    messageContainer.appendChild(controlesMessage);

    // Botones mejorados
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = '20px';
    buttonContainer.style.left = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    container.appendChild(buttonContainer);

    playButton = document.createElement('button');
    playButton.textContent = 'Jugar';
    Object.assign(playButton.style, baseButtonStyle, {
        backgroundColor: '#4CAF50',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    });
    playButton.onmouseover = () => playButton.style.backgroundColor = '#45a049';
    playButton.onmouseout = () => playButton.style.backgroundColor = '#4CAF50';
    playButton.onclick = () => {
        if (!isGameRunning) {
            // Ocultar controles y cambiar texto del botón
            controlsDiv.style.display = 'none';
            playButton.textContent = 'Detener Partida';
            isGameRunning = true;
            startGameTrue();
        }
        else {
            
            scoreLeft = 0;
            scoreRight = 0;
            scoreDisplay.textContent = `${scoreLeft} - ${scoreRight}`;
            gameOver();
            crearGradas(0xADD8E6, 0x4682B4, 0xFFB6C1, 0xCD5C5C);
            crearEspectadores();
            palasUpdate('ALL');
            isGameRunning = false;
            playButton.textContent = 'Jugar';
            winnerMessage.style.display = 'none';
            controlsDiv.style.display = 'block';
        }
        
    };
    buttonContainer.appendChild(playButton);

    const resetCameraButton = document.createElement('button');
    resetCameraButton.textContent = 'Reiniciar Cámara';
    Object.assign(resetCameraButton.style, baseButtonStyle, {
        backgroundColor: '#2196F3',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    });
    resetCameraButton.onmouseover = () => resetCameraButton.style.backgroundColor = '#1976D2';
    resetCameraButton.onmouseout = () => resetCameraButton.style.backgroundColor = '#2196F3';
    resetCameraButton.onclick = resetCameraTrue;
    buttonContainer.appendChild(resetCameraButton);

    // Panel de controles mejorado
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '70px';
    controlsDiv.style.left = '20px';
    controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    controlsDiv.style.padding = '15px 20px';
    controlsDiv.style.borderRadius = '10px';
    controlsDiv.style.backdropFilter = 'blur(5px)';
    controlsDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    container.appendChild(controlsDiv);

    // Función para crear sliders estilizados
    function createSlider(label, min, max, step, value, onChange) {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.margin = '12px 0';
        sliderContainer.style.display = 'flex';
        sliderContainer.style.alignItems = 'center';
        sliderContainer.style.gap = '10px';

        const labelElement = document.createElement('span');
        labelElement.textContent = label;
        labelElement.style.color = '#fff';
        labelElement.style.width = '140px';
        labelElement.style.fontSize = '14px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.width = '180px';
        slider.style.height = '6px';
        slider.style.borderRadius = '3px';
        slider.style.backgroundColor = 'rgba(255,255,255,0.1)';
        slider.style.outline = 'none';
        slider.style.cursor = 'pointer';

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value;
        valueDisplay.style.color = '#fff';
        valueDisplay.style.minWidth = '30px';
        valueDisplay.style.textAlign = 'center';
        valueDisplay.style.backgroundColor = 'rgba(255,255,255,0.1)';
        valueDisplay.style.padding = '4px 8px';
        valueDisplay.style.borderRadius = '4px';
        
        slider.oninput = function() {
            valueDisplay.textContent = this.value;
            onChange(parseFloat(this.value));
        };

        sliderContainer.appendChild(labelElement);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        controlsDiv.appendChild(sliderContainer);
    }

    // Crear sliders
    createSlider('Ancho del campo', 10, 30, 1, anchoCampo, value => {
        anchoCampo = value;
        derechaCampo = anchoCampo / 2;
        izquerdaCampo = -anchoCampo / 2;
        updateFieldGeometry();
    });

    createSlider('Alto del campo', 15, 35, 1, altoCampo, value => {
        altoCampo = value;
        norteCampo = altoCampo / 2;
        surCampo = -altoCampo / 2;
        updateFieldGeometry();
    });

    createSlider('Número de gradas', 2, 7, 1, numeroGradas, value => {
        numeroGradas = value;
        updateFieldGeometry();
    });

    createSlider('Espectadores', 2, 25, 1, espectadoresPorGrada, value => {
        espectadoresPorGrada = value - 1;
        updateFieldGeometry();
    });

    createSlider('Fondo de escena', 0, 4, 1, fondo, value => {
        fondo = value;
        actualizarFondo(fondo);
    });

    // Mensaje de ganador mejorado
    winnerMessage = document.createElement('div');
    winnerMessage.style.position = 'absolute';
    winnerMessage.style.top = '20%';
    winnerMessage.style.left = '50%';
    winnerMessage.style.transform = 'translate(-50%, -50%)';
    winnerMessage.style.fontSize = '48px';
    winnerMessage.style.color = 'white';
    winnerMessage.style.textShadow = '2px 2px 6px rgba(0,0,0,0.8)';
    winnerMessage.style.padding = '20px 40px';
    winnerMessage.style.borderRadius = '10px';
    winnerMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
    winnerMessage.style.display = 'none';
    container.appendChild(winnerMessage);

    controlsDiv.style.display = 'block';
}

// Función para resetear la cámara
function resetCamera() {
    isCameraTransition = false;
    controls.enabled = true;
    
    // Animación de vuelta a posición original
    new TWEEN.Tween(camera.position)
        .to(originalCameraPosition, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    new TWEEN.Tween(controls.target)
        .to(originalCameraTarget, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

//Función para iniciar el juego desde 0
function startGameTrue() {
    gameOver();
    startGame();
}

//Función para iniciar el juego tras gol (sin reiniciar marcador)
function startGame() {
    isPlaying = true;
    resetBall();
    ballSpeed.x = Math.random() > 0.5 ? 0.1 : -0.1;
    ballSpeed.z = 0.25;
    winnerMessage.style.display = 'none';
}

// Función para resetear el balón al centro del campo
function resetBall() {
    ball.position.set(0, 0.5, 0);
    ballSpeed.x = 0;
    ballSpeed.z = 0;

    paddleLeft.position.set(0, 1, surCampo + 0.25);
    paddleRight.position.set(0, 1, norteCampo - 0.25);
}

// Función para hacer saltar a los espectadores cuando no hay gol
function hacerSaltarEspectadores(minAltura, maxAltura, jumpInMs) {
    
    if (!goalCelebration && !endScene){
        espectadoresIzq.forEach(({ cuerpo, cabeza }) => {
            let alturaSalto = Math.random() * (maxAltura-minAltura) + minAltura; // Salto aleatorio entre 1 y 3 unidades

            new TWEEN.Tween(cuerpo.position)
                .to({ y: cuerpo.position.y + alturaSalto }, jumpInMs) // Subir en 500ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true) // Vuelve a bajar
                .repeat(1) // Una sola ida y vuelta
                .start();

            new TWEEN.Tween(cabeza.position)
                .to({ y: cabeza.position.y + alturaSalto }, jumpInMs)
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true)
                .repeat(1)
                .start();
        });

        espectadoresDer.forEach(({ cuerpo, cabeza }) => {
            let alturaSalto = Math.random() * (maxAltura-minAltura) + minAltura; // Salto aleatorio entre 1 y 3 unidades

            new TWEEN.Tween(cuerpo.position)
                .to({ y: cuerpo.position.y + alturaSalto }, jumpInMs) // Subir en 500ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true) // Vuelve a bajar
                .repeat(1) // Una sola ida y vuelta
                .start();

            new TWEEN.Tween(cabeza.position)
                .to({ y: cabeza.position.y + alturaSalto }, jumpInMs)
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true)
                .repeat(1)
                .start();
        });
    }
}

// Función para hacer saltar a los espectadores cuando hay un gol
function hacerSaltarEspectadoresWhenGoal(minAltura, maxAltura, jumpInMs) {

    if (goalCelebration){
        espectadoresIzq.forEach(({ cuerpo, cabeza }) => {
            let alturaSalto = Math.random() * (maxAltura-minAltura) + minAltura; // Salto aleatorio entre 1 y 3 unidades

            new TWEEN.Tween(cuerpo.position)
                .to({ y: cuerpo.position.y + alturaSalto }, jumpInMs) // Subir en 500ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true) // Vuelve a bajar
                .repeat(1) // Una sola ida y vuelta
                .start();

            new TWEEN.Tween(cabeza.position)
                .to({ y: cabeza.position.y + alturaSalto }, jumpInMs)
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true)
                .repeat(1)
                .start();
        });

        
        espectadoresDer.forEach(({ cuerpo, cabeza }) => {
            let alturaSalto = Math.random() * (maxAltura-minAltura) + minAltura; // Salto aleatorio entre 1 y 3 unidades

            new TWEEN.Tween(cuerpo.position)
                .to({ y: cuerpo.position.y + alturaSalto }, jumpInMs) // Subir en 500ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true) // Vuelve a bajar
                .repeat(1) // Una sola ida y vuelta
                .start();

            new TWEEN.Tween(cabeza.position)
                .to({ y: cabeza.position.y + alturaSalto }, jumpInMs)
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true)
                .repeat(1)
                .start();

        });

    }
}

// Función para hacer desaparecer
function hacerDesaparecerEspectadores(altura,jumpInMs, side) {

    if (endScene){
        if (side === 'left'){
            espectadoresIzq.forEach(({ cuerpo, cabeza }) => {
                let alturaSalto = altura + Math.random() * 15
                let randomMs = jumpInMs + Math.random() * 500

                new TWEEN.Tween(cuerpo.position)
                    .to({ y: cuerpo.position.y + alturaSalto }, randomMs) 
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();

                new TWEEN.Tween(cabeza.position)
                    .to({ y: cabeza.position.y + alturaSalto }, randomMs)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();
            });
            espectadoresDer.forEach(({ cuerpo, cabeza }) => {
                let alturaSalto = Math.random() * (5 - 1) + 1; // Salto aleatorio entre 1 y 3 unidades
    
                new TWEEN.Tween(cuerpo.position)
                    .to({ y: cuerpo.position.y + alturaSalto }, 300) 
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .yoyo(true) // Vuelve a bajar
                    .repeat(25) 
                    .start();
    
                new TWEEN.Tween(cabeza.position)
                    .to({ y: cabeza.position.y + alturaSalto }, 300)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .yoyo(true)
                    .repeat(25)
                    .start();
    
            });


    }
    else if (side === 'right'){
        espectadoresDer.forEach(({ cuerpo, cabeza }) => {
            let alturaSalto = altura + Math.random() * 15
            let randomMs = jumpInMs + Math.random() * 500

            new TWEEN.Tween(cuerpo.position)
                .to({ y: cuerpo.position.y + alturaSalto }, randomMs)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();

            new TWEEN.Tween(cabeza.position)
                .to({ y: cabeza.position.y + alturaSalto }, randomMs)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
        });  
        espectadoresIzq.forEach(({ cuerpo, cabeza }) => {
            let alturaSalto = Math.random() * (5 - 1) + 1; // Salto aleatorio entre 1 y 3 unidades

            new TWEEN.Tween(cuerpo.position)
                .to({ y: cuerpo.position.y + alturaSalto }, 300) 
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true) // Vuelve a bajar
                .repeat(25) 
                .start();

            new TWEEN.Tween(cabeza.position)
                .to({ y: cabeza.position.y + alturaSalto }, 300)
                .easing(TWEEN.Easing.Quadratic.Out)
                .yoyo(true)
                .repeat(25)
                .start();

        });


    }
}
}



// Función para actualizar el estado del juego
function updateGame() {
    if (isPlaying && !isCameraTransition) {
        ball.position.x += ballSpeed.x;
        ball.position.z += ballSpeed.z;

        if (ball.position.x <= izquerdaCampo + 0.5 || ball.position.x >= derechaCampo - 0.5) {
            ballSpeed.x *= -1;
        }

        if (ball.position.z <= surCampo + 1 &&
            ball.position.x >= paddleLeft.position.x - 2.75 &&
            ball.position.x <= paddleLeft.position.x + 2.75) {
            ballSpeed.z *= -1;
        }
        else if (ball.position.z <= surCampo + 1){

            scoreLeft++;
            goalscored = true;
            checkWin('left');
            
        }

        if (ball.position.z >= norteCampo - 1 &&
            ball.position.x >= paddleRight.position.x - 2.75 &&
            ball.position.x <= paddleRight.position.x + 2.75) {
            ballSpeed.z *= -1;
        }else if (ball.position.z >= norteCampo - 1){
            scoreRight++;
            goalscored = true;
            checkWin('right');
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
    if (!goalscored){
        if (keys["ArrowLeft"] && paddleRight.position.x > izquerdaCampo + 2.5) {
            paddleRight.position.x -= paddleSpeed;
        }
        if (keys["ArrowRight"] && paddleRight.position.x < derechaCampo - 2.5) {
            paddleRight.position.x += paddleSpeed;
        }
    }

    if (ballSpeed.z > 0){
        ballSpeed.z += 0.0025;
    }
    else if (ballSpeed.z < 0){
        ballSpeed.z -= 0.0025;
    }

    if (!isCameraTransition) {
        controls.update();
    }


}

// Función para determinar si el juego ha terminado
function checkWin(side) {
    if (scoreRight === 3) {
        winnerMessage.textContent = 'Has perdido...';
        ball.position.z -= 0.15;
        playEndSound(side);
        moveCameraToGrandstandsEnd('left',2000);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            endScene = true;
            winnerMessage.style.display = 'block';
        }, 800);
        setTimeout(() => {
            hacerDesaparecerEspectadores(40,4000,'left');
        }, 2000);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            crearGradas(0xFFB6C1, 0xCD5C5C, 0xFFB6C1, 0xCD5C5C);
            palasUpdate('right');
            resetBall();
        }, 4000);
        setTimeout(() => {
            resetCamera();
        }, 5000);
        setTimeout(() => {
            createConfetti(new THREE.Vector3(derechaCampo + 10, 15, 0), 'right');
        }, 5500);
        setTimeout(() => {
            moveCameraToGrandstandsEnd('right',1500);
        }, 6000);
        setTimeout(() => {
            resetCamera();
        }, 8500);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            endScene = false;
        }, 10500);
        setTimeout(() => {
            stopEndSound();
            playButton.textContent = 'Volver a jugar';
            goalscored = false;
        }, 11000);
    } else if (scoreLeft === 3) {
        winnerMessage.textContent = '¡Has ganado!';
        playEndSound(side);
        moveCameraToGrandstandsEnd('right',2000);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            endScene = true;
            winnerMessage.style.display = 'block';
        }, 800);
        setTimeout(() => {
            hacerDesaparecerEspectadores(40,4000,'right');
        }, 1500);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            crearGradas(0xADD8E6, 0x4682B4, 0xADD8E6, 0x4682B4);
            palasUpdate('left');
            resetBall();
        }, 4000);
        setTimeout(() => {
            resetCamera();
        }, 5000);
        setTimeout(() => {
            createConfetti(new THREE.Vector3(izquerdaCampo - 10, 15, 0), 'left');
        }, 5500);
        setTimeout(() => {
            moveCameraToGrandstandsEnd('left',1500);
        }, 6000);
        setTimeout(() => {
            resetCamera();
        }, 8500);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            endScene = false;
        }, 10500);
        setTimeout(() => {
            stopEndSound();
            playButton.textContent = 'Volver a jugar';
            goalscored = false;
        }, 11000);
    } else {
        playGoalSound(side);
        moveCameraToGrandstands(side,700);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            goalCelebration = true;
            if (side === 'left'){ createConfetti(new THREE.Vector3(izquerdaCampo - 10, 10, 0), 'left'); }
            else if (side === "right") { createConfetti(new THREE.Vector3(derechaCampo + 10, 10, 0), 'right');}
            
        }, 800);
        setTimeout(() => {
            resetCamera();
        }, 3500);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            goalCelebration = false;
        }, 4000);
        setTimeout(() => {
            stopGoalSound();
            if (isGameRunning){
                startGame();
            }
            goalscored = false;
        }, 4250);

    }
}

// Función para enfocar a la grada que ha marcado gol
function moveCameraToGrandstands(side,ms) {
    isCameraTransition = true;
    isPlaying = false;
    
    // Guardar posición original
    originalCameraPosition.copy(camera.position);
    originalCameraTarget.copy(controls.target);
    
    // Elegir una grada aleatoria (izquierda o derecha)
    const targetPosition = new THREE.Vector3(
        side === 'left' ? izquerdaCampo - 5 : derechaCampo + 5,
        4,
        0.5 * altoCampo - norteCampo
    );

    // Animación de posición de cámara
    new TWEEN.Tween(camera.position)
        .to(targetPosition, ms)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Animación del objetivo de la cámara
    new TWEEN.Tween(controls.target)
        .to({
            x: side === 'left' ? izquerdaCampo - 6 : derechaCampo + 6,
            y: 3,
            z: targetPosition.z
        }, ms)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Forzar actualización de controles
    controls.enabled = false;
}


function moveCameraToGrandstandsEnd(side,ms) {
    isCameraTransition = true;
    isPlaying = false;
    
    // Guardar posición original
    originalCameraPosition.copy(camera.position);
    originalCameraTarget.copy(controls.target);
    
    // Elegir una grada aleatoria (izquierda o derecha)
    const targetPosition = new THREE.Vector3(
        side === 'left' ? izquerdaCampo + 15 : derechaCampo - 15,
        15,
        0.5 * altoCampo - norteCampo
    );

    // Animación de posición de cámara
    new TWEEN.Tween(camera.position)
        .to(targetPosition, ms)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Animación del objetivo de la cámara
    new TWEEN.Tween(controls.target)
        .to({
            x: side === 'left' ? izquerdaCampo - 6 : derechaCampo + 6,
            y: 3,
            z: targetPosition.z
        }, ms)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Forzar actualización de controles
    controls.enabled = false;
}

// Función para reproducir el sonido de gol
function playGoalSound(side) {
    try {
        if (side === "left") {
            goalSound.currentTime = 0; // Reiniciar el sonido si ya estaba reproduciéndose
            goalSound.play();
        }
        else if (side === "right") {
            goalSound2.currentTime = 0; // Reiniciar el sonido si ya estaba reproduciéndose
            goalSound2.play();
        }

    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }
}
function stopGoalSound() {
    try {
        goalSound.pause();
        goalSound2.pause();
    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }

}

function playEndSound(side) {
    try {
        if (side === "left") {
            winSound.currentTime = 0; // Reiniciar el sonido si ya estaba reproduciéndose
            winSound.play();
        }
        else if (side === "right") {
            loseSound.currentTime = 0; // Reiniciar el sonido si ya estaba reproduciéndose
            loseSound.play();
        }

    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }
}

function stopEndSound() {
    try {
        winSound.pause();
        loseSound.pause();
    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }

}

// Función para terminar el juego y resetear el marcador
function gameOver() {
    isPlaying = false;
    scoreLeft = 0;
    scoreRight = 0;
    resetBall();
}

// Función para resetear la cámara
function resetCameraTrue() {
    camera.position.set(0, 20, 25);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Actualizar controles Orbit si se están usando
    if(controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

function createConfetti(position, side) {
    const confettiCount = 300;
    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];

    for (let i = 0; i < confettiCount; i++) {
        const material = confettiMaterial.clone();
        material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
        
        const confetti = new THREE.Sprite(material);
        confetti.scale.set(0.2, 0.2, 0.2);
        
        // Posición inicial
        confetti.position.set(
            position.x + (Math.random() - 0.5) * 10,
            position.y + Math.random() * 10,
            position.z + (Math.random() - 0.5) * 20
        );

        // Animación
        new TWEEN.Tween(confetti.position)
            .to({
                y: -10,
                x: confetti.position.x + (side === 'left' ? -10 : 10) * Math.random(),
                z: confetti.position.z + (Math.random() - 0.5) * 30
            }, 3000 + Math.random() * 2000)
            .easing(TWEEN.Easing.Quadratic.In)
            .start();

        new TWEEN.Tween(confetti)
            .to({}, 3000 + Math.random() * 2000)
            .onComplete(() => {
                scene.remove(confetti);
                confettiParticles = confettiParticles.filter(p => p !== confetti);
            })
            .start();

        scene.add(confetti);
        confettiParticles.push(confetti);
    }
}

setInterval(() => hacerSaltarEspectadores(0, 0.75, 300), 1000);
setInterval(() => hacerSaltarEspectadoresWhenGoal(0, 3, 100), 250);

//Limitar a 60 fps
let lastTime = 0;
const fps = 60;
const interval = 1000 / fps;

function render(time) {
    const deltaTime = time - lastTime;
    
    if (deltaTime > interval) {
        lastTime = time;

        // Llama a tu función de actualización del juego
        updateGame();
        TWEEN.update(time); // Actualiza las animaciones pasando el tiempo actual
        controls.update();  // Importante para que los controles funcionen
        // Renderiza la escena
        renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
}


// #TODO powerups

// #TODO focos y luces
// #TODO Textures

// #TODO que els espectadors siguen de color blau o roig tonos
// #TODO que la pala també la palme

// #TODO revisar valors incial camps
// #TODO revisar temps animació victoria