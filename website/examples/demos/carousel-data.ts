import alpine from '../assets/carousel/alpine.svg';
import dunes from '../assets/carousel/dunes.svg';
import ocean from '../assets/carousel/ocean.svg';
import forest from '../assets/carousel/forest.svg';
import type { SuperCarouselItem } from '../../../src/components/SuperCarousel/types.ts';
export const carouselItems: SuperCarouselItem[] = [
  {
    id: 'alpine',
    src: alpine,
    alt: '青色天空中的山峰',
    label: '山峦',
  },
  {
    id: 'dunes',
    src: dunes,
    alt: '暖色日落与沙丘',
    label: '落日',
  },
  {
    id: 'ocean',
    src: ocean,
    alt: '蓝色海岸与远山',
    label: '海岸',
  },
  { id: 'forest', src: forest, alt: '绿色山林', label: '山林' },
];
