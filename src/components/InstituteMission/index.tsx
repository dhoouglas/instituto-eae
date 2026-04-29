import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export function InstituteMission() {
    return (
        <View className="mx-4 mt-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row items-center">
                <View className="w-16 h-16 mr-4 rounded-2xl items-center justify-center">
                    <Image
                        source={require('../../../assets/splash-icon-light.png')}
                        style={{ width: 150, height: 150 }}
                        resizeMode="contain"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-[17px] font-[Inter_800ExtraBold] text-gray-900">
                        Instituto EAE
                    </Text>
                    <Text className="text-[9px] font-[Inter_700Bold] text-green-700 uppercase tracking-widest mt-0.5 mb-1.5">
                        Educação Ambiental e Ecoturismo
                    </Text>
                    <Text className="text-[12px] font-[Inter_500Medium] text-gray-600 leading-[18px] text-justify">
                        Recuperação de áreas degradadas aliando reflorestamento, educação patrimonial cultural, natural e ecoturismo.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                className="flex-row items-center self-end mt-2"
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://www.instagram.com/institutoeae/')}
            >
                <FontAwesome name="instagram" size={14} color="#E1306C" />
                <Text className="text-[11px] font-[Inter_700Bold] text-gray-700 ml-1.5">
                    institutoeae
                </Text>
            </TouchableOpacity>
        </View>
    );
}
