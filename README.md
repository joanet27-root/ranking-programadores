# Ranking de Programadores

Web estática para GitHub Pages con votos guardados en Firebase Firestore.

## Qué incluye

- Contraseña común para acceder.
- Contraseña admin separada.
- Programadores definidos por ti en `config.js`.
- Votos de -3 a +3.
- Nombre del votante obligatorio.
- Justificación obligatoria.
- Ranking por suma total.
- Historial público de votos.
- Panel admin para modificar puntos/justificación y eliminar/restaurar votos.

## Archivos

```txt
index.html
styles.css
app.js
config.js
firestore.rules
```

## Paso 1: Crear Firebase

1. Entra en Firebase Console.
2. Crea un proyecto.
3. Crea una app web.
4. Copia el objeto `firebaseConfig`.
5. Activa Firestore Database en modo producción o prueba.

## Paso 2: Configurar `config.js`

Pega tu `firebaseConfig` dentro de `APP_CONFIG.firebaseConfig`.

Cambia la lista de programadores:

```js
export const PROGRAMMERS = [
  { id: "pedro", name: "Pedro" },
  { id: "laura", name: "Laura" }
];
```

El `id` no debe tener espacios ni acentos. El `name` es el texto visible.

## Paso 3: Cambiar contraseñas

La app compara hashes SHA-256, no la contraseña en claro.

Valores iniciales:

- contraseña común: `cambiarme`
- contraseña admin: `admincambiarme`

Para generar hashes nuevos:

1. Abre la web en el navegador.
2. Pulsa F12.
3. Ve a Console.
4. Ejecuta:

```js
generarHash("tu-nueva-contraseña")
```

5. Copia el resultado en `config.js`:

```js
commonPasswordHash: "HASH_DE_LA_CONTRASEÑA_COMUN",
adminPasswordHash: "HASH_DE_LA_CONTRASEÑA_ADMIN",
```

## Paso 4: Reglas de Firestore

Copia el contenido de `firestore.rules` en Firebase Console > Firestore Database > Rules.

Importante: esta primera versión es simple. El panel admin se protege visualmente con contraseña, pero al ser una web estática no es seguridad fuerte contra alguien técnico que inspeccione el código. Para un grupo pequeño sirve. Para seguridad real de admin habría que añadir Firebase Auth con usuarios admin o una Cloud Function.

## Paso 5: Subir a GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube estos archivos a la raíz del repositorio.
3. Entra en Settings > Pages.
4. Source: Deploy from branch.
5. Branch: `main` / root.
6. Guarda.

GitHub te dará una URL pública.

## Siguiente mejora recomendada

Añadir filtro por semana/mes para sacar:

- programador de la semana,
- programador del mes,
- ranking histórico por periodos.
