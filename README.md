# Proyecto-LogisticaGlobal.com
Proyecto de Asignatura Pruebas de Software, Universidad Técnica Federico Santa María. Proyecto realizado por el grupo 8, desarrollado por Jorge Moreno, Andres Saldias, Rolando Rojas, Rodolfo Osorio y Cristóbal Pérez

## Objetivos, Alcances y Propósito
Se crea un sistema de registro de incidencias relacionadas a los accidentes de robots que ocurren en una fabrica, creado para mejorar la eficiencia, sencillez y optimizar el proceso actiual que maneja actualmente la empresa **LogísticaGlobal.com**, el cual es un proceso manual que es realizado en varias etapas por distintos empleados y que actualmente resulta engorroso y dificulta la operatividad de los almacenes, en especial para los supervisores de operaciones.

El sistema busca ser capaz de guardar y eliminar las incidencias, revisar y filtrar las incidencias guardadas, debe permitir modificar las incidencias en cada etapa que se maneja actualmente, solo permitiendo al usuario indicado modificar las incidencias en la etapa que le corresponde. Además, el sistema apoyara la creación del reporte mensual que actualmente realiza el supervisor.

Aunque la empresa le gustaría tener un panel administrativo para gestionar las cuentas, se ha considerado que no es de lo más importante en el sistema, por lo que probablemente no se llegará a realizar, de forma similar, es posible que no se llegue a realizar un sistema resposivo por el tipo de dispositivo utilizado para acceder al sistema

## Descripción de lo realizado (agregar descripciones con version final del sistema, debe ser resumido y que tenga un enlace a una explicación mas detallada en Wiki)

- *Desarrollo CRUD de las incidencias*:
  
- *Creación de la interfaz*:

- *Otros*:

## Tecnologías usadas (agregar explicación de relación con pruebas)

- *Backend*: Para el backend del sistema, se uso node.js y express, tecnologías de javascript utilizadas para el desarrollo del sistema web, express se utilizó especialmente en la creación de las APIs, para comunicar el sistema y la base de datos que guardaba la información de los trabajadores, robots e incidencias.

- *Base de Datos*: La base de datos utilizada para el sistema es postgreSQL, una base de datos relacional, útil para relacionar las incidencias con los trabajadores y robots.

- *Nube*: Se asigno a la pipeline del proyecto, una pipeline de Azure, un servicio de información en la nube de Microsoft.

- *Frontend*: Para el frontend del sistema, se utilizo React, un Framework útil para crear la interfaz del sistema web, utilizado para manejar las rutas de la interfaz del sistema, la creación y edición de las incidencias, el filtro y busqueda de estas

- *Testint*: Para realizar las pruebas del sistema, se utiliza Mocha/Chai, una herramienta de pruebas de Javascript, en especial útil para probar Node.js.

## Evidencias del trabajo (capturas de codigo, pruebas y plataformas)

## Estrategias de pruebas (metodología, tipo de pruebas, pruebas de Frontend, Backend, herramientas empleadas y cobertura de pruebas)

## Supuestos y dependencias

## Instrucciones de instalación

1. Descargar el repositorio de la rama main.

2. Acceder desde la terminal de linea de comandos a las carpetas del server y cliente (por ej: *cd cliente*) y escribir el comando *npm install*, lo que hará que se descarguen las dependencias utilizadas en el sistema. **Importante: Se debe tener descargado Node.js para realizar esto, para descargar Node.js: [Instrucciones Descarga](https://nodejs.org/en/download)**.

3. 
