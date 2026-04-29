# <img src="logo.png" width="50" align="center" /> Instituto EAE - Aplicativo Mobile

![Banner](banner.png)

## 🌍 Sobre o Instituto EAE

O **Instituto EAE (Educação Ambiental e Ecoturismo)** atua na linha de frente da conservação ambiental. Este aplicativo foi desenvolvido para conectar usuários à natureza, fornecendo informações detalhadas sobre a fauna e flora local, além de guiar entusiastas por trilhas ecológicas com segurança e interatividade.

---

## ✨ Funcionalidades

- **Exploração de Biodiversidade:** Catálogo detalhado de Fauna e Flora.
- **Trilhas Interativas:** Mapas em tempo real com marcação de waypoints.
- **Notificações:** Alertas sobre eventos e preservação ambiental.
- **Autenticação Segura:** Integração com Clerk para gestão de perfil.
- **Modo Offline:** Visualização de informações básicas sem conexão.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Linguagem:** TypeScript
- **Estilização:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Mapas:** [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- **Autenticação:** [Clerk Expo](https://clerk.com/docs/quickstarts/expo)
- **Navegação:** [React Navigation](https://reactnavigation.org/)

---

## 🚀 Execução Local

### Pré-requisitos
- Node.js
- Expo Go (no celular) ou Emulador Android/iOS
- Variáveis de ambiente configuradas no `.env`

### Passos

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor do Expo:
   ```bash
   npx expo start
   ```

3. Escaneie o QR Code com o aplicativo Expo Go.

---

## 📦 Build e Distribuição

O projeto utiliza o **EAS (Expo Application Services)** para builds de produção:

```bash
# Para Android (APK/AAB)
eas build --platform android

# Para iOS
eas build --platform ios
```

---

## 📄 Licença

Este projeto é de uso exclusivo do **Instituto EAE**.
