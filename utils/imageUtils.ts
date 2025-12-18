
export const processPixelArt = (
  base64Image: string, 
  targetResolution: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tCtx) return reject(new Error("Canvas context error"));

      tCtx.drawImage(img, 0, 0);
      const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixels = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // 1. 모서리 4개 지점에서 배경색 샘플링 (가장 신뢰할 수 있는 배경 후보)
      const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
      const bgColors = corners.map(([x, y]) => {
        const i = (y * width + x) * 4;
        return { r: pixels[i], g: pixels[i+1], b: pixels[i+2] };
      });
      
      // 4개 모서리 중 가장 빈번한 색상을 기준 배경색으로 설정
      const colorCounts: Record<string, number> = {};
      bgColors.forEach(c => {
        const key = `${c.r},${c.g},${c.b}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      });
      const topKey = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
      const bg = { r: topKey[0], g: topKey[1], b: topKey[2] };

      const getDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        // 색채 대비가 명확한 마젠타 배경을 쓰므로, 단순 유클리드 거리로도 충분히 강력합니다.
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
      };

      // 2. 보수적인 플러드 필 (Flood Fill)
      // 피사체 내부를 보호하기 위해 오직 '외곽에서 연결된' 영역만 탐색합니다.
      // 임계값을 낮춰(45) 피사체의 색상이 배경과 조금이라도 다르면 절대 지우지 않습니다.
      const visited = new Uint8Array(width * height);
      const stack: [number, number][] = corners.map(c => [c[0], c[1]] as [number, number]);

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = y * width + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pIdx = idx * 4;
        // 배경색과 매우 유사한 경우에만 투명화
        if (getDist(bg.r, bg.g, bg.b, pixels[pIdx], pixels[pIdx+1], pixels[pIdx+2]) < 45) {
          pixels[pIdx + 3] = 0; 
          
          const neighbors: [number, number][] = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny * width + nx]) {
              stack.push([nx, ny]);
            }
          }
        }
      }

      // 3. 최소한의 엣지 클리닝
      // 피사체 외곽에 남은 배경색 잔상(안티앨리어싱 잔해)만 아주 조심스럽게 제거합니다.
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (pixels[idx + 3] > 0) {
            const hasTransparentNeighbor = 
              (x > 0 && pixels[(y * width + x - 1) * 4 + 3] === 0) ||
              (x < width - 1 && pixels[(y * width + x + 1) * 4 + 3] === 0) ||
              (y > 0 && pixels[((y - 1) * width + x) * 4 + 3] === 0) ||
              (y < height - 1 && pixels[((y + 1) * width + x) * 4 + 3] === 0);
            
            // 경계선에 있으면서 배경색과 유사한(임계값 80) 픽셀만 제거
            if (hasTransparentNeighbor && getDist(bg.r, bg.g, bg.b, pixels[idx], pixels[idx+1], pixels[idx+2]) < 80) {
              pixels[idx + 3] = 0;
            }
          }
        }
      }

      tCtx.putImageData(imageData, 0, 0);

      // 최종 해상도 렌더링 (픽셀 아트의 날카로움 보존)
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetResolution;
      finalCanvas.height = targetResolution;
      const fCtx = finalCanvas.getContext('2d');
      if (!fCtx) return reject(new Error("Final canvas error"));

      fCtx.imageSmoothingEnabled = false;
      // @ts-ignore
      fCtx.webkitImageSmoothingEnabled = fCtx.mozImageSmoothingEnabled = false;

      fCtx.drawImage(tempCanvas, 0, 0, targetResolution, targetResolution);

      // 알파 채널 이진화 (Binary Alpha)로 완벽한 도트 느낌 구현
      const finalData = fCtx.getImageData(0, 0, targetResolution, targetResolution);
      for (let i = 0; i < finalData.data.length; i += 4) {
        finalData.data[i + 3] = finalData.data[i + 3] < 128 ? 0 : 255;
      }
      fCtx.putImageData(finalData, 0, 0);

      resolve(finalCanvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
