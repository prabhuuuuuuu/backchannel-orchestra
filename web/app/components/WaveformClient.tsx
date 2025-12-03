'use client';

import React, { useState, useEffect } from 'react';
import { Waveform } from './Waveform';

export const WaveformClient: React.FC = () => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <Waveform animate={mounted} />;
};