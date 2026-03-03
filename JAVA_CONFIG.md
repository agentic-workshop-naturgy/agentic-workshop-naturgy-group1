# Configuración de Java para el proyecto

## Java 17 configurado permanentemente

He configurado **Java 17** como tu `JAVA_HOME` predeterminado para tu usuario de Windows. Esto significa que:

✅ El proyecto usará automáticamente Java 17 cuando lo abras en el futuro
✅ No necesitas configurar nada manualmente cada vez
✅ Los scripts funcionarán directamente

## ¿Qué se configuró?

1. **Variable de entorno de usuario**: `JAVA_HOME = C:\Users\juan.cerezo\.jdk\jdk-17.0.16`
   - Esta configuración es permanente para tu usuario
   - Se aplicará en nuevas ventanas de PowerShell/terminal

2. **Carpeta `.mvn`**: Configuración adicional para Maven en el proyecto

3. **Scripts de inicio**: Verifican que Java 17 esté disponible

## Scripts disponibles

- **`start-backend.ps1`** - Inicia el servidor backend
- **`start-frontend.ps1`** - Inicia el servidor frontend  
- **`build.ps1`** - Compila el proyecto

## Nota importante

⚠️ Si abres una nueva terminal, la variable `JAVA_HOME` estará disponible automáticamente.
⚠️ Las terminales que ya están abiertas necesitarán ser cerradas y reabiertas para ver el cambio.

## Verificar la configuración

Para verificar que Java 17 está configurado:

```powershell
$env:JAVA_HOME
java -version
```

Deberías ver Java 17.0.16 como resultado.
