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
import {TWEEN} from "../lib/tween.module.min.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";



// Variables de consenso
let renderer, scene, camera;
let paddleLeft, paddleRight, ball;
let controls;
let goalSound;

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
let espectadores = [];

let isCameraTransition = false;
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

    TWEEN.now = function () {
        return performance.now();
    };

    // Cargar sonido
    goalSound = new Audio('./sounds/pitbull-fireball.mp3');
    goalSound.volume = 0.5; // Ajusta el volumen (opcional)
    
    
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
    const suelo = new THREE.Mesh( new THREE.BoxGeometry(anchoCampo, 1, altoCampo), materialSuelo );
    suelo.position.set(0, -0.5, 0);
    //suelo.rotation.x = -Math.PI / 2;
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
    const materialGradas = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: false });

    let numeroGradas = 4;
    let altoGrada = altoCampo;
    let anchoGrada = 3;

    const colorGradas1 = 0xA9A9A9; // Gris medio
    const colorGradas2 = 0x696969; // Gris oscuro
    
    let colorGradas = colorGradas1;

    for (let i = 0; i < numeroGradas; i++) {

        if (i % 2 === 0) { colorGradas = colorGradas1; }
        else { colorGradas = colorGradas2; }

        if (i != numeroGradas - 1) {

        const materialGradas = new THREE.MeshBasicMaterial({ color: colorGradas, wireframe: false });
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
            const materialGradas = new THREE.MeshBasicMaterial({ color: colorGradas, wireframe: false });
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

    let espectadoresPorGrada = 12;

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
    const materialRed = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const porteriaIzq = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaIzq.position.set(0, 1, norteCampo);
    scene.add(porteriaIzq);

    const porteriaDer = new THREE.Mesh(new THREE.BoxGeometry(anchoCampo, 2, 0.01), materialRed);
    porteriaDer.position.set(0, 1, surCampo);
    scene.add(porteriaDer);

    // Palas del Pong en las porterías
    const materialPala = new THREE.MeshBasicMaterial({ color: 0xDC143C });
    paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala);
    paddleLeft.position.set(0, 1, surCampo + 0.25);
    scene.add(paddleLeft);


    const materialPala2 = new THREE.MeshBasicMaterial({ color: 0x0000CD });
    paddleRight = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.5), materialPala2);
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

function startGameTrue() {
    gameOver();
    startGame();
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

// Función para hacer saltar a los espectadores
function hacerSaltarEspectadores() {
    espectadores.forEach(({ cuerpo, cabeza }) => {
        let alturaSalto = Math.random() * 2 + 1; // Salto aleatorio entre 1 y 3 unidades

        new TWEEN.Tween(cuerpo.position)
            .to({ y: cuerpo.position.y + alturaSalto }, 500) // Subir en 500ms
            .easing(TWEEN.Easing.Quadratic.Out)
            .yoyo(true) // Vuelve a bajar
            .repeat(1) // Una sola ida y vuelta
            .start();

        new TWEEN.Tween(cabeza.position)
            .to({ y: cabeza.position.y + alturaSalto }, 500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .yoyo(true)
            .repeat(1)
            .start();
    });
}

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
            checkWin();
        }

        if (ball.position.z >= norteCampo - 1 &&
            ball.position.x >= paddleRight.position.x - 2.75 &&
            ball.position.x <= paddleRight.position.x + 2.75) {
            ballSpeed.z *= -1;
        }else if (ball.position.z >= norteCampo - 1){
            scoreRight++;
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

    if (!isCameraTransition) {
        controls.update();
    }


}

function checkWin() {
    if (scoreRight === 3) {
        winnerMessage.textContent = 'Has perdido...';
        ball.position.z -= 0.15;
        gameOver();
    } else if (scoreLeft === 3) {
        winnerMessage.textContent = '¡Has ganado!';
        gameOver();
    } else {
        playGoalSound();
        moveCameraToGrandstands();
        setTimeout(() => {
            resetCamera();
        }, 6000);
        setTimeout(() => {
            stopGoalSound()
            startGame();
        }, 7000);

    }
}

// Añade estas nuevas funciones
function moveCameraToGrandstands() {
    isCameraTransition = true;
    isPlaying = false;
    
    // Guardar posición original
    originalCameraPosition.copy(camera.position);
    originalCameraTarget.copy(controls.target);
    
    // Elegir una grada aleatoria (izquierda o derecha)
    const side = Math.random() > 0.5 ? 'left' : 'right';
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

setInterval(hacerSaltarEspectadores, 2000)

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


// #TODO salto, cambio de camara, confeti y musica cuando hay gol
// #TODO algo para cuando ganes + sonido
// #TODO suelo general para que no este flotando todo + focos y luces
// #TODO opción noche dia tarde con más o menos espectadores
// #TODO powerups