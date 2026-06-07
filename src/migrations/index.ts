import * as migration_20260607_004841_initial from './20260607_004841_initial';
import * as migration_20260607_031705_add_route_fare_images from './20260607_031705_add_route_fare_images';
import * as migration_20260607_042848_add_route_landing_content from './20260607_042848_add_route_landing_content';
import * as migration_20260607_050729_add_uploadthing_media_fields from './20260607_050729_add_uploadthing_media_fields';

export const migrations = [
  {
    up: migration_20260607_004841_initial.up,
    down: migration_20260607_004841_initial.down,
    name: '20260607_004841_initial',
  },
  {
    up: migration_20260607_031705_add_route_fare_images.up,
    down: migration_20260607_031705_add_route_fare_images.down,
    name: '20260607_031705_add_route_fare_images',
  },
  {
    up: migration_20260607_042848_add_route_landing_content.up,
    down: migration_20260607_042848_add_route_landing_content.down,
    name: '20260607_042848_add_route_landing_content',
  },
  {
    up: migration_20260607_050729_add_uploadthing_media_fields.up,
    down: migration_20260607_050729_add_uploadthing_media_fields.down,
    name: '20260607_050729_add_uploadthing_media_fields'
  },
];
