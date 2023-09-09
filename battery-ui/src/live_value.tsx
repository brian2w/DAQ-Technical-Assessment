import React, { useState } from 'react';
import './App.css';
import './live_value.css';

interface TemperatureProps {
  temp: number;
}

function LiveValue({ temp }: TemperatureProps) {
  const [isGlowing, setIsGlowing] = useState(true);

  // const valueColour = 'white';
  const red = Math.min(255, Math.max(0, temp));
  const blue = Math.min(255, Math.max(0, 180 - temp));

  return (
    <header
      className={`live-value`}
      style={{
        color: `rgb(${red}, 80, ${blue})`,
        fontStyle: 'italic',
        stroke: '',
      }}
    >
      {`${temp.toString()}°C`}
    </header>
  );
}

export default LiveValue;
