# Conclusiones y aprendizaje

## Conclusión grupal

El desarrollo y revisión de BeeKeep permitió comprender que la calidad de un sistema no depende únicamente de que sus funcionalidades sean visibles y operativas, sino también de la calidad interna de su código y de su capacidad para mantenerse y evolucionar.

A lo largo del trabajo se identificaron problemas de deuda técnica, duplicación, responsabilidades poco delimitadas y oportunidades de mejora en el tipado, la documentación y las pruebas. A partir de ese diagnóstico se aplicaron principios de SOLID, Clean Code y técnicas de refactoring orientadas a mejorar la estructura interna sin modificar innecesariamente el comportamiento externo del sistema.

El proceso de Code Review permitió además detectar inconsistencias entre código, documentación y pruebas, demostrando la importancia de realizar revisiones técnicas antes de considerar una versión como terminada.

Una de las principales dificultades fue mantener sincronizadas las distintas partes del proyecto mientras evolucionaban los servicios, modelos, vistas y pruebas. Esto evidenció la necesidad de conservar una buena trazabilidad entre los cambios realizados y la documentación correspondiente.

Como mejora futura, se considera importante continuar reduciendo el uso de tipos genéricos como `any`, mejorar la centralización del manejo de errores, revisar periódicamente las pruebas automatizadas y seguir dividiendo responsabilidades cuando determinados archivos aumenten su complejidad.

En conclusión, el trabajo permitió aplicar de manera integrada conceptos de calidad interna y externa, deuda técnica, code smells, principios SOLID, Clean Code, refactoring seguro, pruebas y Code Review profesional.

## Conclusión individual

Mi participación en la etapa de Code Review me permitió comprobar que una revisión profesional no consiste solamente en buscar errores visibles en el código.

Fue necesario analizar la relación entre la implementación actual, las pruebas, la configuración y la documentación del proyecto. Durante la revisión se detectaron problemas de tipado, configuración, código de prueba desactualizado y documentación que no reflejaba completamente el estado real del sistema.

También aprendí que no todas las observaciones deben resolverse inmediatamente. En algunos casos es preferible documentar una mejora futura antes que introducir un cambio de gran alcance que pueda generar regresiones cerca de la entrega.

Esta etapa me permitió comprender mejor la importancia de trabajar con criterios de aceptación, evidencia técnica y feedback objetivo, manteniendo como prioridad la estabilidad del sistema y la mantenibilidad del código.