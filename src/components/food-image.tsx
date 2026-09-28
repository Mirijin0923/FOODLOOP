import React from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';

const LOCAL_IMAGES: Record<string, number> = {
  'seed-bakery': require('@/assets/images/seed-bakery.jpg'),
  'seed-curry': require('@/assets/images/seed-curry.jpg'),
};

export function FoodImage({ image, ...props }: Omit<ImageProps, 'source'> & { image: string }) {
  const source: ImageSourcePropType = LOCAL_IMAGES[image] ?? { uri: image };
  return <Image {...props} source={source} />;
}
