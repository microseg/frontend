import React, { useState } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Tabs, Tab } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// 添加RLE解析函数
const decodeRLE = (rle, shape) => {
  const [height, width] = shape;
  const mask = new Array(height * width).fill(0);
  let pos = 0;
  
  for (let i = 0; i < rle.length; i += 2) {
    const start = rle[i];
    const length = rle[i + 1];
    for (let j = 0; j < length; j++) {
      mask[start + j] = 1;
    }
  }
  
  // 计算边界框
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 1) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
};

const LayerInfo = ({ analysis, expanded, onExpand, onFlakeSelect }) => {
  const [selectedThickness, setSelectedThickness] = useState(null);
  const [selectedFlakeIndex, setSelectedFlakeIndex] = useState(null);

  if (!analysis) return null;

  const handleThicknessChange = (thickness) => {
    setSelectedThickness(thickness === selectedThickness ? null : thickness);
    setSelectedFlakeIndex(null);
  };

  const handleFlakeClick = (flake, index) => {
    setSelectedFlakeIndex(selectedFlakeIndex === index ? null : index);
    
    // 如果flake有mask信息，计算边界框并触发回调
    if (flake.mask && flake.mask.rle && flake.mask.shape) {
      const bbox = decodeRLE(flake.mask.rle, flake.mask.shape);
      onFlakeSelect(bbox);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        分析结果
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography>
          检测到的石墨烯片: {analysis.totalFlakes}
        </Typography>
        <Typography>
          不同层数: {analysis.count}
        </Typography>
      </Box>

      {/* 层数列表 */}
      <Box sx={{ mb: 2 }}>
        {analysis.sortedLabels.map((thickness) => (
          <Box 
            key={thickness}
            onClick={() => handleThicknessChange(thickness)}
            sx={{
              cursor: 'pointer',
              p: 1,
              mb: 1,
              borderRadius: 1,
              bgcolor: selectedThickness === thickness ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            <Typography
              sx={{
                color: analysis.colorMap[thickness],
                fontWeight: 'bold'
              }}
            >
              {analysis.labelDescriptions[thickness]}
              <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                ({analysis.flakesByThickness[thickness].length} flakes)
              </Typography>
            </Typography>

            {/* 显示该层的所有flakes */}
            {selectedThickness === thickness && (
              <Box sx={{ mt: 1, pl: 2 }}>
                {analysis.flakesByThickness[thickness].map((flake, index) => (
                  <Box
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlakeClick(flake, index);
                    }}
                    sx={{
                      p: 1,
                      mb: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: selectedFlakeIndex === index ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <Typography variant="body2">
                      Flake {index + 1}
                    </Typography>

                    {/* 显示选中flake的详细信息 */}
                    {selectedFlakeIndex === index && (
                      <Box sx={{ mt: 1, pl: 2 }}>
                        <Typography variant="body2">
                          面积: {flake.size.toFixed(2)} μm²
                        </Typography>
                        <Typography variant="body2">
                          纵横比: {flake.aspect_ratio.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          误报概率: {(flake.false_positive_probability * 100).toFixed(2)}%
                        </Typography>
                        {flake.position && (
                          <>
                            <Typography variant="body2">
                              位置: ({flake.position.x}, {flake.position.y})
                            </Typography>
                            <Typography variant="body2">
                              尺寸: {flake.position.width} × {flake.position.height}
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* 检测参数 */}
      {analysis.detectionParams && (
        <Accordion expanded={expanded} onChange={onExpand}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>检测参数</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 2 }}>
              {Object.entries(analysis.detectionParams).map(([key, value]) => (
                <Typography key={key} variant="body2">
                  {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                </Typography>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default LayerInfo; 