"use client";

import React, { useEffect, useState } from 'react';
import { LucideProps } from 'lucide-react';

interface ClientLucideIconProps extends LucideProps {
  icon: React.ComponentType<LucideProps>;
}

export function ClientLucideIcon({ icon: Icon, ...props }: ClientLucideIconProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Render nothing on the server
  }

  return <Icon {...props} />;
}