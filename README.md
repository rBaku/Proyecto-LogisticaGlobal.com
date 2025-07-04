# Proyecto-LogisticaGlobal.com
Proyecto de Asignatura Pruebas de Software (IN-331), Universidad Técnica Federico Santa María, Casa Central. Proyecto realizado por el grupo 8, desarrollado por:
- [Jorge Moreno](https://github.com/SSJorge)
- [Andres Saldias](https://github.com/Mickxz)
- [Rolando Rojas](https://github.com/re-rojas)
- [Rodolfo Osorio](https://github.com/rBaku)
- [Cristóbal Pérez](https://github.com/cristobalP02)

### Link al video: https://youtu.be/0UcnRony0kU
### Link al video 2: https://www.youtube.com/watch?v=qXa1yXSrKuY
### Link al video 3: https://www.youtube.com/watch?v=6zdxV7ho8yU

## Objetivos, Alcances y Propósito
Se crea un sistema de registro de incidencias relacionadas a los accidentes de robots que ocurren en una fábrica, creado para mejorar la eficiencia, simplificar y optimizar el proceso que actualmente utiliza la empresa **[LogísticaGlobal.com](https://github.com/Pruebas-de-Software/HandsOnProject/blob/main/semestres/2025-1/logisticaglobal.md)**. Dicho proceso es manual, se realiza en varias etapas por distintos empleados y resulta engorroso, dificultando la operatividad de los almacenes, especialmente para los supervisores de operaciones.

El sistema busca ser capaz de guardar y eliminar las incidencias, revisar y filtrar las incidencias guardadas, permitir modificar las incidencias en cada etapa que se maneja actualmente, solo permitiendo al usuario indicado modificar las incidencias en la etapa que le corresponde. Además, el sistema apoyara la creación del reporte mensual que actualmente realiza el supervisor.

Pruebas con usuarios y de volumen de datos no han sido consideradas. Se han realizado todos los requisitos funcionales y la mayoria de los no funcionales

## Descripción del sistema

Descripción de cada vista importante del sistema, considerar que el sistema guarda información, no solo de las incidencias, sino que también de robots y técnicos de la empresa, para más detalles, acceder cuando se mencione cada tema a un enlace a la [wiki](../../wiki).

- *Página inicial*: Una [página](../../wiki/Página-inicial) a la que se es dirigido al iniciar el sistema, desde aqui se puede acceder al estado de los robots, la creación de una incidencia y la lista de incidencias.

- *Manejo de las incidencias*: Para el proceso de las [incidencias](../../wiki/Incidencias-de-robots), se tienen las siguientes formas de interactuar con el sistema:

1. Creación de una incidencia: Para la creación de la incidencia, se tiene una página que se accede desde la página inicial, esta es vista por un administrador, supervisor o jefe de turno y permite crear una incidencia nueva con 1 o más robots asociados, si hay más de uno, se crean varias incidencias en el sistema.

2. Observar las incidencias guardadas: Para observar una lista de las incidencias que se han guardado actualmente, hay una página que se accede desde la página inicial. Donde se muestran los diversos datos asociados a cada incidente, como los IDs, la fecha, ubicación, entre otros.

3. Observar los detalles de un incidentes: En la página donde se observa la lista, se puede acceder a los detalles de cada incidente, donde se mostrará un modal con cada detalle.

4. Editar una incidencia: A lo largo de cada etapa del proceso que sigue la empresa con los incidentes, es necesario editar en más de una ocasión, por lo que en la lista de incidentes, también se puede acceder a editar cada una de estas, lo que despliegará un modal. Esta función solo es accesible para supervisores o administradores.

5. Eliminar una incidencia: De igual manera que los dos casos anteriores, en la lista de incidencias se da la opción de eliminar cada una de estas, al presionar el ícono se eliminará permanentemente del sistema.

6. Historial de cambios: Los cambios generados en un incidente son trazables. Supervisores y administradores pueden ver el historial de cambios para ver qué y cuándo cambió
  
- *Manejo de los robots*: Dentro de la empresa, una parte fundamental son los [robots](../../wiki/Robots-de-la-empresa), dentro del sistema se guardan los robots para que sean fácilmente accesibles al crear una incidencia, por lo que se tiene una página que es accesible desde la página inicial. Esta página despliega la lista de los robots guardados actualmente en el sistema. Solo un adminisrador puede agregar, editar y eliminar robots en el sistema. Sin embargo, cuando un técnico resuelve un incidente manda un estado final de ese robot, y cuando un usuario lo firma, se actualiza el estado de ese robot.

- *Vista de técnicos*: Luego de que un supervisor revise la incidencia, se le asigna a uno o más [técnicos](../../wiki/Vista-de-técnicos) que se revisen los robots que estuvieron involucrados, por ello se creó una vista para que los técnicos puedan conocer las incidencias que han sido asignados a ellos, mostrando una lista de incidentes, donde se pueden editar según el proceso que se sigue en la empresa.

- *Reportes de Supervisor*: El supervisor requiere generar un [informe PDF](../../wiki/Reporte-de-incidentes) en periodos de los incidentes ocurridos en robots de la empresa. Se creo una vista exclusiva para ellos y los admins, que recopila la información y genera un pequeño resumen de la cantidad, gravedad y tipo de los incidentes. 

## Stack tecnológico

El sistema utiliza la siguiente tecnología:

### Backend y Frontend

- PostgreSQL (base de datos)
- Express (Backend)
- React (Frontend)
- Node.js (Backend)
- Microsoft Azure (servicio de nube)

### Otras Tecnologías (Testing, automatización, organización)

- Mocha/Chai (Testing)
- Jenkins (Herramienta CI/CD)
- Selenium (Automatización Testing)
- Discord/Whatsapp (Comunicación)
- Jira (Kanban, organización requisitos)
- Slack (Integración mensajes con herramientas)
- Github (Repositorio código y documentación)

Para más información, dirigirse a la página de la wiki dedicada al [Stack tecnológico](../../wiki/Tecnologias-usadas-en-el-proyecto).

## Instrucciones de instalación

1. Descargar el repositorio de la rama main.

2. Acceder desde la terminal de línea de comandos a las carpetas del server y cliente (por ej: *cd cliente*) y escribir el comando *npm install*, lo que hará que se descarguen las dependencias utilizadas en el sistema. **Importante: Se debe tener descargado Node.js para realizar esto, para descargar Node.js: [Instrucciones Descarga](https://nodejs.org/en/download)**.

3. Se debe configurar la cuenta de Microsoft Azure en un equipo con azure cli, para habilitar la nube.

4. Se debe configurar un archivo .env que tenga la información para conectarse a la base de datos (nube). Los datos a configurar son:

- *DB_HOST*: El host de la base de datos Microsoft Azure.

- *DB_USER*: El usuario que tiene acceso a la base de datos, puede ser un correo electrónico.

- *DB_NAME*: Nombre de la base de datos de la nube.

- *DB_PORT*: Puerto a donde accede el sistema a la base de datos.

5. Utilizar **npm start** en las carpetas de server y cliente, al igual que cuando se instalaron las dependencias, para que empiece a funcionar el backend y frontend, correspondientemente.

6. Acceder a http://localhost:3000/ en el buscador y se accederá al sistema.

## Documentacion

Para acceder a documentación que complementa y describe el proceso realizado para crear el proyecto se encuentra en la [Wiki](../../wiki). Algunos enlaces de interes pueden ser:

- Las [tecnologías](../../wiki/Tecnologias-usadas-en-el-proyecto) que se usan en el sistema y las pruebas que se pueden realizar en estas.

- Los [supuestos y dependencias](../../wiki/Supuestos-y-Dependencias-del-sistema) que se deben tener en consideración al usar el sistema.

- La documentación de las [pruebas](../../wiki/Pruebas-realizadas) realizadas hasta el momento, tanto para probar el Backend, como el Frontend.

- Imagenes que sirven de [evidencias](../../wiki/Evidencias-del-trabajo-realizado) de los sistemas utilizados para mejorar la comunicación del equipo y facilitar el proceso de desarrollo, además de mostrar partes del código desarrollado para las entregas.

- Los [requisitos no funcionales](../../wiki/Requisitos-no-funcionales) que se han considerado en el sistema, las pruebas que se han realizado y el alcance de lo realizado.
