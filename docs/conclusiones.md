# Conclusiones y aprendizaje

## Conclusión grupal

El desarrollo y revisión de BeeKeep permitió comprobar que la calidad de un sistema no depende únicamente de que sus funcionalidades sean visibles y operativas, sino también de la calidad interna del código, su mantenibilidad y su capacidad de evolucionar sin introducir regresiones.

A lo largo del trabajo se analizaron aspectos relacionados con deuda técnica, code smells, principios SOLID, Clean Code, refactoring seguro, pruebas automatizadas y revisión profesional del código.

Durante el Code Review se detectaron inconsistencias entre código, configuración, pruebas y documentación. A partir de estas observaciones se seleccionaron correcciones de bajo riesgo orientadas a mejorar la calidad interna sin modificar innecesariamente el comportamiento funcional del sistema.

Entre las mejoras realizadas se incluyeron ajustes de tipado en TypeScript, actualización de documentación, configuración de tipos de Node.js, eliminación de código muerto dentro de las pruebas y actualización de tests que habían quedado desincronizados respecto de la implementación actual.

La revisión técnica también permitió detectar inicialmente 16 errores durante el proceso de build. Luego de aplicar las correcciones correspondientes, el proyecto logró completar correctamente el build de producción mediante `npm run build`.

Como parte de la verificación se ejecutaron pruebas automatizadas. Las pruebas unitarias realizadas mediante Vitest finalizaron correctamente, con 2 pruebas aprobadas y ninguna falla.

También se ejecutaron pruebas End-to-End mediante Playwright. En Chromium se obtuvieron 12 pruebas aprobadas y ninguna falla, permitiendo comprobar los principales flujos funcionales del sistema en dicho navegador.

Durante la ejecución multiplataforma de Playwright se detectaron fallas asociadas principalmente a tiempos de espera y conexión en otros navegadores. Estas observaciones quedaron documentadas como oportunidades de mejora futuras relacionadas con la estabilidad y compatibilidad de las pruebas E2E.

Una de las principales enseñanzas obtenidas durante el trabajo fue la importancia de mantener sincronizados el código, las pruebas y la documentación. Una funcionalidad puede funcionar correctamente desde la perspectiva del usuario y, aun así, presentar problemas internos que afecten su mantenimiento o evolución futura.

Como mejoras futuras se considera importante continuar reduciendo el uso de tipos genéricos como `any`, mejorar la centralización del manejo de errores, revisar periódicamente las pruebas automatizadas y continuar separando responsabilidades cuando determinados componentes aumenten su complejidad.

En conclusión, el trabajo permitió aplicar de forma integrada los conceptos principales de Metodología de Sistemas II, demostrando que un sistema profesional no solo debe funcionar, sino también poder ser revisado, probado, mantenido y evolucionado de manera segura.

## Conclusión individual

Mi participación se concentró principalmente en la etapa de Code Review profesional y en el análisis final de calidad del proyecto.

Esta etapa me permitió comprender que una revisión técnica no consiste solamente en observar si el código funciona o buscar errores de sintaxis. También requiere analizar la relación entre la implementación, los tipos utilizados, las pruebas automatizadas, la configuración del proyecto y la documentación existente.

Durante la revisión se utilizó un checklist técnico para evaluar distintos aspectos del proyecto, incluyendo arquitectura, principios SOLID, Clean Code, tipado, manejo de errores, persistencia, pruebas, documentación y trazabilidad.

A partir de este proceso se detectaron problemas concretos y se realizaron correcciones de bajo riesgo. Entre ellas se mejoró el tipado de elementos utilizados en formularios, se corrigieron inconsistencias con tipos del dominio, se actualizaron configuraciones necesarias para TypeScript, se eliminó código de pruebas que ya no era utilizado y se corrigieron pruebas que habían quedado desactualizadas.

Uno de los resultados más importantes de esta etapa fue la reducción de los errores detectados por el proceso de build. Inicialmente se encontraron 16 errores distribuidos en distintos archivos y, luego de las correcciones realizadas durante el Code Review, el build de producción logró finalizar correctamente.

También se verificó el comportamiento mediante pruebas automatizadas. Las pruebas unitarias finalizaron correctamente y las pruebas E2E ejecutadas en Chromium obtuvieron 12 resultados aprobados sin fallas.

Además, la revisión permitió identificar que no todos los problemas deben corregirse inmediatamente. En algunos casos es más adecuado documentar una observación como mejora futura antes que realizar cambios estructurales de alto riesgo cerca de una entrega.

Esta experiencia me permitió comprender mejor la importancia de utilizar evidencia técnica, criterios de aceptación y feedback objetivo para justificar las decisiones tomadas durante una revisión profesional.

Como aprendizaje final, considero que el Code Review funciona como una herramienta fundamental para mejorar la calidad del software, detectar inconsistencias que pueden pasar desapercibidas durante el desarrollo y reducir riesgos antes de considerar una versión como terminada.