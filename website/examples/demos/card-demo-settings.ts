export interface CardDemoSettings {
  mode: 'request' | 'external';
  tagsLimit: number | 'all';
  status: 'preset' | 'custom' | 'hidden';
  placement: 'bottom-right' | 'image-bottom-right';
  image: 'mixed' | 'missing' | 'failed';
  imageFit: 'cover' | 'contain';
  always: boolean;
  reserve: boolean;
  narrow: boolean;
  description: boolean;
  icon: boolean;
  createdAt: boolean;
  switch: boolean;
  selection: boolean;
  actions: boolean;
  customSlots: boolean;
  tags: boolean;
  extra: boolean;
  switchDisabled: boolean;
  selectionDisabled: boolean;
}

export function createCardSettings(
  mode: CardDemoSettings['mode'],
): CardDemoSettings {
  return {
    mode,
    tagsLimit: 1,
    status: 'preset',
    placement: 'bottom-right',
    image: 'mixed',
    imageFit: 'cover',
    always: false,
    reserve: true,
    narrow: false,
    description: true,
    icon: true,
    createdAt: true,
    switch: true,
    selection: true,
    actions: true,
    customSlots: false,
    tags: true,
    extra: true,
    switchDisabled: false,
    selectionDisabled: false,
  };
}
