/**
 * Pong2.js
 * 
 * Script para el juego del Pong 2 en Three.js
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

// Variables de partes de la geometría
let suelo, cesped, paredIzq, paredDer, porteriaIzq, porteriaDer, lineas;
let paddleLeft, paddleRight, ball;
let farolas = [];
let gradas = [];
let espectadoresArray = [];

//Varuables de valores de la geometría
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
let scoreDisplay, winnerMessage, firstTo3Message;

// Variables de estado
let goalSound;
let ballSpeed = { x: 0, z: 0 };
let scoreLeft = 0, scoreRight = 0;
let keys = {};
let paddleLeftUpdate;
let paddleLeftUpdateTimer = -1;
let goalCelebration = false;
let goalscored = false;
let isCameraTransition = false;
let paddleSpeed = 1;
let isPlaying = false;
let espectadores = [];


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
    const loader = new THREE.TextureLoader();
        loader.load('./images/pitbull2.jpg', function(texture) {
    scene.background = texture;
    });

    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 18, 22 );
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
    goalSound.volume = 0.5; // Ajusta el volumen (opcional)
    
    // Crear controles para el "giroscopio"
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
    const colorGradas1Izq = 0xADD8E6; // Light Blue
    const colorGradas2Izq = 0x4682B4; // Steel Blue
    const colorGradas1Der = 0xFFB6C1; // Gris medio
    const colorGradas2Der = 0xCD5C5C; // Gris oscuro

    let colorGradasIzq = colorGradas1Izq;
    let colorGradasDer = colorGradas1Der;

    for (let i = 0; i < numeroGradas; i++) {

        if (i % 2 === 0) {
            colorGradasIzq = colorGradas1Izq;
            colorGradasDer = colorGradas1Der;
        }
        else {
             colorGradasDer = colorGradas2Der
             colorGradasIzq = colorGradas2Izq;
        }

        if (i != numeroGradas - 1) {

        const materialGradasIzq = new THREE.MeshBasicMaterial({ color: colorGradasIzq, wireframe: false });
        const gradaIzq = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 1, anchoGrada), materialGradasIzq);
        gradaIzq.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (i * anchoGrada) , i, -0.5);
        gradaIzq.rotation.y = Math.PI / 2;
        scene.add(gradaIzq);
        
        const materialGradasDer = new THREE.MeshBasicMaterial({ color: colorGradasDer, wireframe: false });
        const gradaDer = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 1, anchoGrada), materialGradasDer);
        gradaDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (i * anchoGrada) , i, -0.5);
        gradaDer.rotation.y = -Math.PI / 2;
        scene.add(gradaDer);
        
        }
        else {
            const materialGradasIzq = new THREE.MeshBasicMaterial({ color: colorGradasIzq, wireframe: false });
            const gradaIzq = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 3, anchoGrada/3), materialGradasIzq);
            gradaIzq.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (i * anchoGrada) + anchoGrada/3 , i, -0.5);
            gradaIzq.rotation.y = Math.PI / 2;
            scene.add(gradaIzq);

            const materialGradasDer = new THREE.MeshBasicMaterial({ color: colorGradasDer, wireframe: false });
            const gradaDer = new THREE.Mesh(new THREE.BoxGeometry(altoGrada, 3, anchoGrada/3), materialGradasDer);
            gradaDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (i * anchoGrada) - anchoGrada/3 , i, -0.5);
            gradaDer.rotation.y = -Math.PI / 2;
            scene.add(gradaDer);
        }

    }

    // Espectadores bien distribuidos

    for (let fila = 0; fila < numeroGradas - 1; fila++) {
        for (let i = -(espectadoresPorGrada / 2); i <= espectadoresPorGrada / 2; i++) {

            const colorAleatorio = Math.random() * 0xffffff;
            const materialEspectador = new THREE.MeshBasicMaterial({ color: colorAleatorio });
            let cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 8), materialEspectador);
            let cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), materialEspectador);
            cabeza.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (fila * anchoGrada), fila + 1.2, i * 1.5);
            cuerpo.position.set(izquerdaCampo-(anchoGrada/2)-0.75 - (fila * anchoGrada), fila + 0.5, i * 1.5);
            scene.add(cuerpo);           
            scene.add(cabeza);

            espectadores.push({ cuerpo, cabeza });

            const colorAleatorioDer = Math.random() * 0xffffff;
            const materialEspectadorDer = new THREE.MeshBasicMaterial({ color: colorAleatorioDer });

            let cuerpoDer = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 8), materialEspectadorDer);
            let cabezaDer = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), materialEspectadorDer);
            cabezaDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (fila * anchoGrada), fila + 1.2, i * 1.5);
            cuerpoDer.position.set(derechaCampo+(anchoGrada/2)+0.75 + (fila * anchoGrada), fila + 0.5, i * 1.5);
            scene.add(cabezaDer);
            scene.add(cuerpoDer);
            espectadores.push({ cuerpo: cuerpoDer, cabeza: cabezaDer });
        }
    }


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
    paddleLeft.position.set(0, 1, surCampo + 0.25);
    paddleRight.position.set(0, 1, norteCampo - 0.25);

    // Actualizar farolas
    farolas.forEach(f => scene.remove(f));
    farolas = [
        crearFarola(izquerdaCampo - 2, norteCampo + 2),
        crearFarola(derechaCampo + 2, norteCampo + 2),
        crearFarola(izquerdaCampo - 2, surCampo - 2),
        crearFarola(derechaCampo + 2, surCampo - 2)
    ];
    farolas.forEach(f => scene.add(f));
}

function createUI() {
    const container = document.getElementById('container');

    // Marcador
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

    // Mensaje de primero a tres
    const uiDiv2 = document.createElement('div');
    uiDiv2.style.position = 'absolute';
    uiDiv2.style.top = '50px';
    uiDiv2.style.left = '50%';
    uiDiv2.style.transform = 'translateX(-50%)';
    uiDiv2.style.fontSize = '24px';
    uiDiv2.style.color = 'white';
    container.appendChild(uiDiv2);

    firstTo3Message = document.createElement("div");
    firstTo3Message.textContent = "¡El primero que llegue a 3 goles gana!";
    uiDiv2.appendChild(firstTo3Message);

    // Botón Play
    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.style.display = 'block';
    playButton.onclick = startGameTrue;
    playButton.style.position = "absolute";
    playButton.style.top = "10px";
    playButton.style.left = "50px";
    container.appendChild(playButton);

    // Botón Reset Camera
    const resetCameraButton = document.createElement('button');
    resetCameraButton.textContent = 'Reset Camera';
    resetCameraButton.style.display = 'block';
    resetCameraButton.onclick = resetCameraTrue;
    resetCameraButton.style.position = "absolute";
    resetCameraButton.style.top = "10px";
    resetCameraButton.style.left = "150px";  // Posición a la derecha del botón Play
    container.appendChild(resetCameraButton);

    // Mensaje de ganador
    winnerMessage = document.createElement('div');
    winnerMessage.style.position = 'absolute';
    winnerMessage.style.top = '150px';
    winnerMessage.style.left = '50%';
    winnerMessage.style.transform = 'translate(-50%, -50%)';
    winnerMessage.style.fontSize = '48px';
    winnerMessage.style.color = 'white';
    winnerMessage.style.display = 'none';
    container.appendChild(winnerMessage);

    // Contenedor para los sliders (lado izquierdo)
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '100px';
    controlsDiv.style.left = '20px';
    controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    controlsDiv.style.padding = '15px';
    controlsDiv.style.borderRadius = '10px';
    container.appendChild(controlsDiv);

    // Variables ajustables

    createSlider(
        'Ancho Campo',
        10,
        30,
        1,
        anchoCampo,
        value => {
            anchoCampo = value;
            derechaCampo = anchoCampo / 2;
            izquerdaCampo = -anchoCampo / 2;
            updateFieldGeometry();
        }
    );

    createSlider(
        'Alto Campo',
        15,
        35,
        1,
        altoCampo,
        value => {
            altoCampo = value;
            norteCampo = altoCampo / 2;
            surCampo = -altoCampo / 2;
            updateFieldGeometry();
        }
    );

    // Función para crear sliders
    function createSlider(label, min, max, step, value, onChange) {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.margin = '10px 0';
        
        const labelElement = document.createElement('span');
        labelElement.textContent = label + ': ';
        labelElement.style.color = 'white';
        labelElement.style.marginRight = '10px';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.width = '200px';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value;
        valueDisplay.style.color = 'white';
        valueDisplay.style.marginLeft = '10px';
        
        slider.oninput = function() {
            valueDisplay.textContent = this.value;
            onChange(parseFloat(this.value));
        };

        sliderContainer.appendChild(labelElement);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        controlsDiv.appendChild(sliderContainer);
    }
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
    
    if (!goalCelebration){
        espectadores.forEach(({ cuerpo, cabeza }) => {
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
        espectadores.forEach(({ cuerpo, cabeza }) => {
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
        gameOver();
    } else if (scoreLeft === 3) {
        winnerMessage.textContent = '¡Has ganado!';
        gameOver();
    } else {
        playGoalSound();
        moveCameraToGrandstands(side);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            goalCelebration = true;
        }, 1000);
        setTimeout(() => {
            resetCamera();
        }, 3000);
        setTimeout(() => { // Tiempo de espera para que el sonido se haga efecto
            goalCelebration = false;
        }, 3500);
        setTimeout(() => {
            stopGoalSound();
            startGame();
            goalscored = false;
        }, 4250);

    }
}

// Función para enfocar a la grada que ha marcado gol
function moveCameraToGrandstands(side) {
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
        .to(targetPosition, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Animación del objetivo de la cámara
    new TWEEN.Tween(controls.target)
        .to({
            x: side === 'left' ? izquerdaCampo - 6 : derechaCampo + 6,
            y: 3,
            z: targetPosition.z
        }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Forzar actualización de controles
    controls.enabled = false;
}

// Función para reproducir el sonido de gol
function playGoalSound() {
    try {
        goalSound.currentTime = 0; // Reiniciar el sonido si ya estaba reproduciéndose
        goalSound.play();
    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }
}
function stopGoalSound() {
    try {
        goalSound.pause();
    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }

}

// Función para terminar el juego y resetear el marcador
function gameOver() {
    isPlaying = false;
    scoreLeft = 0;
    scoreRight = 0;
    winnerMessage.style.display = 'block';
}

// Función para resetear la cámara
function resetCameraTrue() {
    camera.position.set(0, 15, 22);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Actualizar controles Orbit si se están usando
    if(controls) {
        controls.target.set(0, 0, 0);
        controls.update();
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


// #TODO confeti cuando hay gol
// #TODO algo para cuando ganes + sonido
// #TODO focos y luces
// #TODO opción noche dia tarde con más o menos espectadores
// #TODO powerups
// #TODO cambio de imagen de fondo