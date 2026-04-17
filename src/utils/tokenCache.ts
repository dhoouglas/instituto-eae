import * as SecureStore from "expo-secure-store";

export const tokenCache = {
    async getToken(key: string) {
        try {
            const item = await SecureStore.getItemAsync(key);
            if (item) {
                console.log(`${key} foi restaurado do SecureStore 🔐`);
            } else {
                console.log("Nenhum token salvo para a chave: " + key);
            }
            return item;
        } catch (error) {
            console.error("Erro ao recuperar token do SecureStore:", error);
            await SecureStore.deleteItemAsync(key);
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return await SecureStore.setItemAsync(key, value);
        } catch (err) {
            console.error("Erro ao salvar token no SecureStore:", err);
            return;
        }
    },
};
