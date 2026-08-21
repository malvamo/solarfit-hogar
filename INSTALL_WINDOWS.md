# Instalación reproducible en Windows

## Requisitos

- Windows 10 u 11 con PowerShell.
- Node.js 24.16.0, indicado en `.nvmrc`.
- Acceso HTTPS a `re.jrc.ec.europa.eu` si se consultará PVGIS.

## Preparación

Abra PowerShell dentro de la carpeta `solarfit-hogar` y ejecute:

```powershell
node --version
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm --version
pnpm install --frozen-lockfile
pnpm check
```

Los valores esperados son Node `v24.16.0`, pnpm `11.19.0` y un cierre de `pnpm check` sin errores. `pnpm typecheck` genera primero los tipos de rutas de Next.js, de modo que una copia limpia no depende de archivos creados en otra instalación.

## Ejecución local

```powershell
pnpm dev
```

Abra `http://localhost:3000`. Para detener el servidor, pulse `Ctrl+C` en PowerShell.

## Ejecución de producción local

```powershell
pnpm build
pnpm start
```

## PVWatts opcional

PVWatts no es necesario para calcular con HSP ni para consultar PVGIS. Si el equipo dispone legítimamente de una clave NLR:

1. Copie `.env.example` como `.env.local`.
2. Escriba `NLR_API_KEY` solo en `.env.local`.
3. Reinicie el servidor.

Nunca comparta `.env.local`, pegue la clave en el navegador ni añada `NEXT_PUBLIC_` al nombre de la variable.

## Respaldo y transferencia

- Use **Proyecto JSON** para guardar un escenario completo.
- Use **Abrir JSON** en el otro computador; el archivo se valida y el resultado se recalcula.
- El almacenamiento local no se sincroniza entre navegadores.
- No ingrese titular, número de cuenta, dirección exacta ni otros datos personales de una factura.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `pnpm` no existe | Ejecute los dos comandos de Corepack anteriores |
| Fallo al instalar | Confirme Node 24.16.0 y vuelva a ejecutar `pnpm install --frozen-lockfile` |
| PVGIS no responde | Verifique internet, espere y conserve el mensaje; no invente la serie |
| PVWatts responde 503 | La clave opcional no está configurada en el servidor |
| El borrador no vuelve | Restaure el JSON exportado; el navegador pudo bloquear o borrar `localStorage` |

