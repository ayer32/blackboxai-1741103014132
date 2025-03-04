/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)/login` | `/(auth)/signup` | `/(tabs)` | `/(tabs)/` | `/(tabs)/budget` | `/(tabs)/expenses` | `/(tabs)/explore` | `/(tabs)/insights` | `/(tabs)/profile` | `/_sitemap` | `/budget` | `/expenses` | `/explore` | `/insights` | `/login` | `/profile` | `/signup`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
