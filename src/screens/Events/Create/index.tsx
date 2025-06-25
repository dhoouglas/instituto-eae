import React, { useState } from "react";
import { View, Text, SafeAreaView, TextInput, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import { z } from "zod";
import Toast from "react-native-toast-message";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { createEventSchema } from "@/utils/schemas/eventSchemas";

export function CreateEventScreen() {
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreateEvent() {
    setIsLoading(true);

    const validation = createEventSchema.safeParse({
      title,
      date,
      location,
      description,
    });

    if (!validation.success) {
      Toast.show({
        type: "error",
        text1: "Dados Inválidos",
        text2: validation.error.errors[0].message,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Simula uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Exemplo: await api.post('/events', { title, date, location, description });

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "O evento foi criado com sucesso.",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao Criar Evento",
        text2: "Não foi possível salvar o evento. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView>
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold]">
            Informações do Evento
          </Text>
          <Text className="text-base text-gray-500 mt-1 mb-6">
            Preencha os detalhes abaixo para criar um novo evento.
          </Text>

          <Input
            placeholder="Título do Evento"
            value={title}
            onChangeText={setTitle}
            className="mb-4"
          />
          <Input
            placeholder="Data (ex: 25/12/2025)"
            value={date}
            onChangeText={setDate}
            className="mb-4"
          />
          <Input
            placeholder="Localização (ex: Parque Ibirapuera, SP)"
            value={location}
            onChangeText={setLocation}
            className="mb-4"
          />

          <Text className="text-sm font-semibold text-gray-600 mb-2 ml-1">
            Descrição
          </Text>
          <TextInput
            placeholder="Descreva os detalhes do evento, como atividades, horários e o que levar..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={5}
            className="w-full border border-gray-300 rounded-xl p-5 text-lg font-[Inter_400Regular] h-32"
            textAlignVertical="top"
          />

          <View className="mt-8">
            <Button
              title="Salvar Evento"
              onPress={handleCreateEvent}
              isLoading={isLoading}
              className="bg-green-logo py-4 rounded-xl"
              textClassName="text-white text-lg font-bold"
              hasShadow
              shadowColor="#2A9D8F"
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
