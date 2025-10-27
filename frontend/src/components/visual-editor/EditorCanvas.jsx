import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import './EditorCanvas.css'

function EditorCanvas({ scene, width, height, selectedLayerId, onSelectLayer, onUpdateLayer }) {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true
    })

    fabricCanvasRef.current = fabricCanvas

    // Handle object selection
    fabricCanvas.on('selection:created', (e) => {
      if (e.selected && e.selected[0]) {
        const layerId = e.selected[0].layerId
        onSelectLayer(layerId)
      }
    })

    fabricCanvas.on('selection:updated', (e) => {
      if (e.selected && e.selected[0]) {
        const layerId = e.selected[0].layerId
        onSelectLayer(layerId)
      }
    })

    fabricCanvas.on('selection:cleared', () => {
      onSelectLayer(null)
    })

    // Handle object modifications
    fabricCanvas.on('object:modified', (e) => {
      const obj = e.target
      if (!obj || !obj.layerId) return

      const updates = {
        properties: {
          x: obj.left,
          y: obj.top,
          width: obj.width * obj.scaleX,
          height: obj.height * obj.scaleY,
          rotation: obj.angle,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY
        }
      }

      onUpdateLayer(obj.layerId, updates)
    })

    return () => {
      fabricCanvas.dispose()
    }
  }, [width, height])

  // Render layers on canvas
  useEffect(() => {
    if (!fabricCanvasRef.current || !scene) return

    const canvas = fabricCanvasRef.current
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.renderAll()

    scene.layers.forEach(layer => {
      if (!layer.visible) return

      let fabricObject = null

      switch (layer.type) {
        case 'text':
          fabricObject = new fabric.Textbox(layer.properties.text || 'Text', {
            left: layer.properties.x,
            top: layer.properties.y,
            fontSize: layer.properties.fontSize,
            fontFamily: layer.properties.fontFamily,
            fontWeight: layer.properties.fontWeight,
            fontStyle: layer.properties.fontStyle,
            fill: layer.properties.color,
            backgroundColor: layer.properties.backgroundColor,
            stroke: layer.properties.stroke,
            strokeWidth: layer.properties.strokeWidth,
            textAlign: layer.properties.textAlign,
            angle: layer.properties.rotation,
            opacity: layer.properties.opacity,
            selectable: !layer.locked,
            lockMovementX: layer.locked,
            lockMovementY: layer.locked,
            lockRotation: layer.locked,
            lockScalingX: layer.locked,
            lockScalingY: layer.locked
          })
          break

        case 'shape':
          if (layer.properties.shapeType === 'rectangle') {
            fabricObject = new fabric.Rect({
              left: layer.properties.x,
              top: layer.properties.y,
              width: layer.properties.width,
              height: layer.properties.height,
              fill: layer.properties.fill,
              stroke: layer.properties.stroke,
              strokeWidth: layer.properties.strokeWidth,
              rx: layer.properties.cornerRadius,
              ry: layer.properties.cornerRadius,
              angle: layer.properties.rotation,
              opacity: layer.properties.opacity,
              selectable: !layer.locked,
              lockMovementX: layer.locked,
              lockMovementY: layer.locked,
              lockRotation: layer.locked,
              lockScalingX: layer.locked,
              lockScalingY: layer.locked
            })
          } else if (layer.properties.shapeType === 'circle') {
            fabricObject = new fabric.Circle({
              left: layer.properties.x,
              top: layer.properties.y,
              radius: layer.properties.width / 2,
              fill: layer.properties.fill,
              stroke: layer.properties.stroke,
              strokeWidth: layer.properties.strokeWidth,
              angle: layer.properties.rotation,
              opacity: layer.properties.opacity,
              selectable: !layer.locked,
              lockMovementX: layer.locked,
              lockMovementY: layer.locked,
              lockRotation: layer.locked,
              lockScalingX: layer.locked,
              lockScalingY: layer.locked
            })
          }
          break

        case 'image':
          if (layer.properties.src) {
            fabric.FabricImage.fromURL(layer.properties.src, { crossOrigin: 'anonymous' })
              .then((img) => {
                img.set({
                  left: layer.properties.x,
                  top: layer.properties.y,
                  scaleX: layer.properties.width / (img.width || 1),
                  scaleY: layer.properties.height / (img.height || 1),
                  angle: layer.properties.rotation,
                  opacity: layer.properties.opacity,
                  selectable: !layer.locked,
                  lockMovementX: layer.locked,
                  lockMovementY: layer.locked,
                  lockRotation: layer.locked,
                  lockScalingX: layer.locked,
                  lockScalingY: layer.locked
                })
                img.layerId = layer.id
                canvas.add(img)
                canvas.renderAll()
              })
              .catch((err) => {
                console.error('Failed to load image:', err)
              })
            return
          }
          break

        case 'video':
          // Placeholder for video (show as grey rectangle)
          fabricObject = new fabric.Rect({
            left: layer.properties.x,
            top: layer.properties.y,
            width: layer.properties.width,
            height: layer.properties.height,
            fill: '#cccccc',
            stroke: '#666666',
            strokeWidth: 2,
            angle: layer.properties.rotation,
            opacity: layer.properties.opacity,
            selectable: !layer.locked,
            lockMovementX: layer.locked,
            lockMovementY: layer.locked,
            lockRotation: layer.locked,
            lockScalingX: layer.locked,
            lockScalingY: layer.locked
          })

          // Add video label
          const videoLabel = new fabric.Textbox('VIDEO', {
            left: layer.properties.x + layer.properties.width / 2,
            top: layer.properties.y + layer.properties.height / 2,
            fontSize: 20,
            fontFamily: 'Arial',
            fill: '#333333',
            originX: 'center',
            originY: 'center',
            selectable: false
          })
          canvas.add(videoLabel)
          break
      }

      if (fabricObject) {
        fabricObject.layerId = layer.id
        canvas.add(fabricObject)

        // Select if this is the selected layer
        if (layer.id === selectedLayerId) {
          canvas.setActiveObject(fabricObject)
        }
      }
    })

    canvas.renderAll()
  }, [scene, selectedLayerId])

  // Handle zoom
  const handleZoom = (delta) => {
    const newZoom = Math.max(0.1, Math.min(2, zoom + delta))
    setZoom(newZoom)

    const canvas = fabricCanvasRef.current
    if (canvas) {
      canvas.setZoom(newZoom)
      canvas.renderAll()
    }
  }

  return (
    <div className="editor-canvas-container">
      <div className="canvas-controls">
        <button onClick={() => handleZoom(0.1)} className="zoom-btn">+</button>
        <span className="zoom-display">{Math.round(zoom * 100)}%</span>
        <button onClick={() => handleZoom(-0.1)} className="zoom-btn">-</button>
        <button onClick={() => setZoom(1)} className="zoom-btn">Reset</button>
      </div>

      <div className="canvas-wrapper" style={{ transform: `scale(${zoom})` }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

export default EditorCanvas
