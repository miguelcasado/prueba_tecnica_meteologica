# Documentación

Aplicación web desarrollada con **Svelte 5** y **TypeScript** que visualiza datos meteorológicos a partir de un archivo `data.yml`.  
La aplicación simula la llegada progresiva de datos en tiempo real, actualizando la interfaz cada 5 segundos.

---

## Descripción general

El sistema representa lecturas de temperatura y energía en una interfaz que combina un gráfico temporal, estadísticas acumuladas y una tabla con los valores más recientes.

Cada lectura incluye:
- Hora del registro.
- Temperatura actual en grados Celsius.
- Energía generada en kilovatios-hora (kWh).

Los datos se consumen de manera progresiva y se actualizan automáticamente en la vista.  
El gráfico principal muestra los valores agregados por minuto, aunque también permite alternar entre intervalos de 5 segundos, minutos u horas.  
En paralelo, se calculan la temperatura media acumulada y la energía total producida desde el inicio de la simulación.

---

## Funcionamiento

1. **Carga inicial**  
   Al iniciar la aplicación, se lee el archivo `data.yml`, que contiene series de temperatura (en décikelvin) y potencia (en megavatios).

2. **Conversión y procesamiento**  
   Los valores se convierten a unidades físicas interpretables:
   - Temperatura en °C → `C = (dK / 10) - 273.15`
   - Energía en kWh → `kWh = MW × 1000 × (stepSeconds / 3600)`
   
   Durante esta fase también se generan sumas acumuladas para optimizar el cálculo de promedios y totales.

3. **Actualización periódica**  
   Cada 5 segundos, un generador asíncrono emite una nueva lectura simulando la recepción de datos en tiempo real.  
   La interfaz se actualiza automáticamente sin recargar la página, manteniendo visible el último valor recibido.

4. **Visualización**  
   - **Gráfico:** muestra la evolución de la temperatura o energía según el intervalo seleccionado.  
   - **Tarjetas:** indican la temperatura media y la energía total acumulada.  
   - **Tabla:** lista los últimos valores registrados, destacando el más reciente con un degradado visual.
---

---

## Estructura del código
src/
├─ lib/
│ ├─ components/ # Gráfico, tabla y tarjetas de estadísticas
│ ├─ services/ # Generador de datos en tiempo real
│ ├─ utils/ # Funciones de conversión, tiempo, agregación y carga YAML
│ └─ types.ts # Definición de tipos de datos
└─ routes/
└─ +page.svelte # Página principal y lógica de visualización


---

## Instalación y ejecución

**Requisitos:**
- Node.js 18 o superior  
- pnpm, npm o yarn  

**Pasos:**

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir en el navegador
http://localhost:5173



Notas adicionales

La actualización cada 5 segundos se basa en la hora del sistema, alineando los datos con el tiempo real.

Los cálculos se realizan en memoria, sin dependencias de servidor.

Se utilizan componentes modulares de Svelte para separar la visualización del procesamiento de datos.
