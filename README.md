# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Fade Society

Fade Society is an Expo development demo for discovering barbers and managing appointments. It is currently an internal prototype, not a public marketplace.

## Current Scope

- Customer discovery, studio search, barber profiles, service selection, and local demo bookings.
- Barber and owner demo views through the clearly labeled Demo role control.
- Local demo state only. There is no authentication, backend, payment processing, live availability, notifications, or production support workflow yet.
- The authoritative Expo Router tree is `src/app`.

## Run

```powershell
npm install
npx expo start --dev-client --clear
```

For the installed iPhone development build, open the build from the EAS project page, then run the command above from the project directory.

## Quality Gates

```powershell
npm test -- --run
npm run lint
npx tsc --noEmit
npx expo export --platform ios --clear
```

## Demo Flow

1. Home -> Find a barber.
2. Search/filter studios.
3. Open a barber profile.
4. Select a service, date, and time.
5. Review and confirm the appointment.
6. Verify it in Bookings.
7. Reschedule, cancel, restore, and view it in Calendar.
8. Use Profile -> Demo role to preview barber and owner surfaces.
9. Use Profile -> Reset demo data before repeating a stakeholder demo.

## Roadmap

See [docs/production-roadmap.md](docs/production-roadmap.md) for the ordered path from demo foundation to a production marketplace.

Phase 1 details are in [docs/phase-1-foundation.md](docs/phase-1-foundation.md).
