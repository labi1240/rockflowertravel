import * as migration_20260607_004841_initial from './20260607_004841_initial';
import * as migration_20260607_031705_add_route_fare_images from './20260607_031705_add_route_fare_images';
import * as migration_20260607_042848_add_route_landing_content from './20260607_042848_add_route_landing_content';
import * as migration_20260607_050729_add_uploadthing_media_fields from './20260607_050729_add_uploadthing_media_fields';
import * as migration_20260607_075943_add_messages from './20260607_075943_add_messages';
import * as migration_20260614_172433_add_fare_booking_addons from './20260614_172433_add_fare_booking_addons';
import * as migration_20260615_221731_add_booking_cancellation_request from './20260615_221731_add_booking_cancellation_request';

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
    name: '20260607_050729_add_uploadthing_media_fields',
  },
  {
    up: migration_20260607_075943_add_messages.up,
    down: migration_20260607_075943_add_messages.down,
    name: '20260607_075943_add_messages',
  },
  {
    up: migration_20260614_172433_add_fare_booking_addons.up,
    down: migration_20260614_172433_add_fare_booking_addons.down,
    name: '20260614_172433_add_fare_booking_addons',
  },
  {
    up: migration_20260615_221731_add_booking_cancellation_request.up,
    down: migration_20260615_221731_add_booking_cancellation_request.down,
    name: '20260615_221731_add_booking_cancellation_request'
  },
];
