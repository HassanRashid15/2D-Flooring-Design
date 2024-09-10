
document.addEventListener('mousemove', (e) => {
    const cursor = document.getElementById('custom-cursor');
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
});

document.addEventListener('mousedown', () => {
    document.getElementById('custom-cursor').classList.add('clicked');
});

document.addEventListener('mouseup', () => {
    document.getElementById('custom-cursor').classList.remove('clicked');
});

const interactiveElements = document.querySelectorAll('button, a');
interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        document.getElementById('custom-cursor').classList.add('blinking');
        document.getElementById('custom-cursor').classList.add('enlarged');
    });
    element.addEventListener('mouseleave', () => {
        document.getElementById('custom-cursor').classList.remove('blinking');
        document.getElementById('custom-cursor').classList.remove('enlarged');
    });
});









async function fetchJsonData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load floorplan data. Please try again later.');
    }
}

class FloorplanDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.hoveredFurniture = null;
        this.jsonData = {};
        this.tooltip = document.getElementById('tooltip');
        this.initialize();
    }

    async initialize() {
        try {
            this.jsonData = await fetchJsonData('sample.json'); 
            this.renderFloorplan();
            this.addEventListeners();
        } catch (error) {
            console.error('Error initializing floorplan:', error);
        }
    }

    drawRegion(region) {
        this.ctx.beginPath();
        this.ctx.moveTo(region[0].X, region[0].Y);
        region.forEach(point => this.ctx.lineTo(point.X, point.Y));
        this.ctx.closePath();
        this.ctx.strokeStyle = 'black';
        this.ctx.stroke();
    }

    drawDoor(door) {
        this.ctx.save();
        this.ctx.translate(door.Location.X, door.Location.Y);
        this.ctx.rotate(door.Rotation);
        this.ctx.fillStyle = 'brown';
        this.ctx.fillRect(-door.Width / 2, -5, door.Width, 10);
        this.ctx.restore();
    }

    drawFurniture(furniture) {
        this.ctx.save();
        this.ctx.translate(furniture.xPlacement, furniture.yPlacement);
        this.ctx.rotate(furniture.rotation);
        this.ctx.fillStyle = 'lightgray';
        this.ctx.fillRect(furniture.MinBound.X, furniture.MinBound.Y, 
                         furniture.MaxBound.X - furniture.MinBound.X, 
                         furniture.MaxBound.Y - furniture.MinBound.Y);
        this.ctx.restore();
    }

    showTooltip(x, y, text) {
        const adjustedX = x * this.scale + this.offsetX;
        const adjustedY = y * this.scale + this.offsetY;
        
        this.tooltip.style.left = `${adjustedX}px`;
        this.tooltip.style.top = `${adjustedY}px`;
        this.tooltip.textContent = text;
        this.tooltip.style.display = 'block';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    checkHover(x, y) {
        let hoveredFurniture = null;
        this.jsonData.Furnitures.forEach(furniture => {
            const xMin = furniture.xPlacement + furniture.MinBound.X;
            const xMax = furniture.xPlacement + furniture.MaxBound.X;
            const yMin = furniture.yPlacement + furniture.MinBound.Y;
            const yMax = furniture.yPlacement + furniture.MaxBound.Y;
            
            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                hoveredFurniture = furniture;
            }
        });
        if (hoveredFurniture) {
            this.showTooltip(
                hoveredFurniture.xPlacement + hoveredFurniture.MinBound.X,
                hoveredFurniture.yPlacement + hoveredFurniture.MinBound.Y - 10,
                hoveredFurniture.equipName
            );
        } else {
            this.hideTooltip();
        }
        this.hoveredFurniture = hoveredFurniture;
    }

    checkClick(x, y) {
        this.jsonData.Furnitures.forEach(furniture => {
            const xMin = furniture.xPlacement + furniture.MinBound.X;
            const xMax = furniture.xPlacement + furniture.MaxBound.X;
            const yMin = furniture.yPlacement + furniture.MinBound.Y;
            const yMax = furniture.yPlacement + furniture.MaxBound.Y;
            
            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                alert(`Clicked on ${furniture.equipName}`);
            }
        });
    }

    renderFloorplan() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        if (this.jsonData.Regions) {
            this.jsonData.Regions.forEach(region => this.drawRegion(region));
        }
        if (this.jsonData.Doors) {
            this.jsonData.Doors.forEach(door => this.drawDoor(door));
        }
        if (this.jsonData.Furnitures) {
            this.jsonData.Furnitures.forEach(furniture => this.drawFurniture(furniture));
        }
        if (this.hoveredFurniture) {
            this.showTooltip(
                this.hoveredFurniture.xPlacement + this.hoveredFurniture.MinBound.X,
                this.hoveredFurniture.yPlacement + this.hoveredFurniture.MinBound.Y - 10,
                this.hoveredFurniture.equipName
            );
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.renderFloorplan());

        document.getElementById('zoom-in').addEventListener('click', () => {
            this.scale = Math.min(this.scale * 1.1, 4);
            this.renderFloorplan();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.scale = Math.max(this.scale / 1.1, 0.125);
            this.renderFloorplan();
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.scale += e.deltaY * -0.01;
            this.scale = Math.min(Math.max(0.125, this.scale), 4);
            this.renderFloorplan();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            let startX = e.clientX;
            let startY = e.clientY;

            const onMouseMove = (e) => {
                this.offsetX += e.clientX - startX;
                this.offsetY += e.clientY - startY;
                startX = e.clientX;
                startY = e.clientY;
                this.renderFloorplan();
            };

            const onMouseUp = () => {
                this.canvas.removeEventListener('mousemove', onMouseMove);
                this.canvas.removeEventListener('mouseup', onMouseUp);
            };

            this.canvas.addEventListener('mousemove', onMouseMove);
            this.canvas.addEventListener('mouseup', onMouseUp);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.checkHover(x / this.scale - this.offsetX / this.scale,
                            y / this.scale - this.offsetY / this.scale);
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.checkClick(x / this.scale - this.offsetX / this.scale,
                            y / this.scale - this.offsetY / this.scale);
        });

        const resetZoomButton = document.createElement('button');
        resetZoomButton.textContent = 'Reset Zoom';
        resetZoomButton.style.position = 'absolute';
        resetZoomButton.style.width = '145px';
        resetZoomButton.style.top = '0px';
        resetZoomButton.style.right = '37px';
        resetZoomButton.style.padding = '10px';
        resetZoomButton.style.fontSize = '16px';
        resetZoomButton.style.cursor = 'pointer';
        resetZoomButton.style.border = 'none';
        resetZoomButton.style.borderRadius = '5px';
        resetZoomButton.style.backgroundColor = '#28a745';
        resetZoomButton.style.color = '#fff';
        resetZoomButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        resetZoomButton.style.transition = 'background-color 0.3s, box-shadow 0.3s';
        document.getElementById('controls').appendChild(resetZoomButton);

        resetZoomButton.addEventListener('click', () => {
            this.scale = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            this.renderFloorplan();
        });
    }
}

window.onload = () => {
    const canvas = document.getElementById('floorplan');
    new FloorplanDrawer(canvas);
};
