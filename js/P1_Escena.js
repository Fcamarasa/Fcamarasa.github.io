/**
 * Escena.js
 * 
 * Practica AGM #1. Escena basica en three.js
 * Seis objetos organizados en un grafo de escena con
 * transformaciones, animacion basica y modelos importados
 * 
 * @author 
 * 
 */

// Modulos necesarios
/*******************
 * TO DO: Cargar los modulos necesarios
 *******************/
import * as THREE from "three"; // Librería principal para gráficos 3D
import {GLTFLoader} from "../lib/GLTFLoader.module.js" // Para cargar modelos glTF


// Variables de consenso
let renderer, scene, camera;

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/

let figuras = []; // Array para almacenar las figuras del pentágono
let modeloImportado; // Variable para el modelo en el centro del pentágono
let rotacionPentagono = 0; // Ángulo de rotación del conjunto pentagonal

// Acciones
init();
loadScene();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    /*******************
    * TO DO: Completar el motor de render y el canvas
    *******************/
    renderer.setClearColor(0x000000); // Color de fondo negro
    document.body.appendChild(renderer.domElement); // Adjunta el canvas generado al DOM

    // Escena
    scene = new THREE.Scene();
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );
}

function loadScene()
{
    const material = new THREE.MeshNormalMaterial( );

    /*******************
    * TO DO: Construir un suelo en el plano XZ
    *******************/
    const suelo = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        material
    );
    suelo.rotation.x = -Math.PI / 2; // Rotación para que quede horizontal
    scene.add

    /*******************
    * TO DO: Construir una escena con 5 figuras diferentes posicionadas
    * en los cinco vertices de un pentagono regular alredor del origen
    *******************/
    const radioPentagono = 155;
    for (let i = 0; i < 5; i++) {
        const angulo = (i * 2 * Math.PI) / 5; // Divide el círculo en 5 partes
        const figura = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2), // Alternativamente, usa otras geometrías
            material
        );
        figura.position.set(
            radioPentagono * Math.cos(angulo),
            0.5,
            radioPentagono * Math.sin(angulo)
        );
        figuras.push(figura); // Almacena la figura
        scene.add(figura); // Añádela a la escena
    }
    

    /*******************
    * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
    *******************/
    const loader = new GLTFLoader();
    loader.load("models/RobotExpressive.glb", function (gltf) {
        modeloImportado = gltf.scene;
        modeloImportado.position.y = 0.5; // Eleva el modelo ligeramente
        scene.add(modeloImportado);
    });
    
    /*******************
    * TO DO: Añadir a la escena unos ejes
    *******************/
    scene.add(new THREE.AxesHelper(5)); // Ejes visibles con longitud 5 unidades

}

function update()
{
    /*******************
    * TO DO: Modificar el angulo de giro de cada objeto sobre si mismo
    * y del conjunto pentagonal sobre el objeto importado
    *******************/
   /*******************
 * TO DO: Modificar el angulo de giro de cada objeto sobre si mismo
 *******************/
figuras.forEach((figura, index) => {
    figura.rotation.y += 0.01 * (index + 1); // Cada figura rota a distinta velocidad
});

/*******************
 * TO DO: Rotar el conjunto pentagonal sobre el objeto importado
 *******************/
rotacionPentagono += 0.01;
figuras.forEach((figura) => {
    figura.position.x = 5 * Math.cos(rotacionPentagono); // Movimiento circular
    figura.position.z = 5 * Math.sin(rotacionPentagono);
});

}

function render()
{
    requestAnimationFrame( render );
    update();
    renderer.render( scene, camera );
}