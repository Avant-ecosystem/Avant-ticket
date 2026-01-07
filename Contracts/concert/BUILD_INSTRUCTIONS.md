# Instrucciones de Compilación

## Problema Resuelto

El error `failed to find a workspace root` se ha resuelto creando un `Cargo.toml` padre en el directorio `Contracts/` que define el workspace.

## Estructura del Workspace

```
Contracts/
├── Cargo.toml          # Workspace root (NUEVO)
└── concert/
    ├── Cargo.toml      # Miembro del workspace
    ├── app/
    ├── client/
    └── ...
```

## Compilación

### Opción 1: Desde el directorio del workspace (Recomendado)

```bash
cd "C:\Users\nicov\OneDrive\Desktop\Portafolio\Avant Ticket\Contracts"
cargo build --release -p "concert"
```

### Opción 2: Desde el directorio del contrato

```bash
cd "C:\Users\nicov\OneDrive\Desktop\Portafolio\Avant Ticket\Contracts\concert"
cargo build --release
```

## Verificar Compilación

El archivo WASM compilado estará en:
```
Contracts/concert/target/wasm32-gear/release/concert.opt.wasm
```

## Ejecutar Tests

```bash
cd "C:\Users\nicov\OneDrive\Desktop\Portafolio\Avant Ticket\Contracts"
cargo test --release -p "concert"
```

## Dependencias del Workspace

El workspace está configurado para usar las siguientes dependencias desde los repositorios de Gear Foundation:

- `sails-rs`: Framework para Gear/Vara Network
- `gstd`: Gear Standard Library
- `extended-vmt`: Variable Multi Token contract
- `extended-vmt-client`: Cliente para VMT

Todas las dependencias se descargarán automáticamente la primera vez que compiles.

## Notas Importantes

1. **Primera compilación**: La primera vez puede tardar varios minutos mientras descarga y compila todas las dependencias.

2. **Toolchain requerido**: Asegúrate de tener el toolchain `wasm32-unknown-unknown`:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. **Si hay errores de dependencias**: Verifica que tengas acceso a los repositorios de GitHub o ajusta las URLs en `Contracts/Cargo.toml`.

## Solución de Problemas

### Error: "failed to find a workspace root"
✅ **Resuelto**: Se creó el archivo `Contracts/Cargo.toml` que define el workspace.

### Error: "package not found"
- Verifica que estés compilando desde el directorio correcto
- Asegúrate de que el workspace esté configurado correctamente

### Error: "cannot find crate"
- Ejecuta `cargo update` para actualizar las dependencias
- Verifica que las URLs de los repositorios sean correctas

