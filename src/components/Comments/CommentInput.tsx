import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import api from '@/lib/api';
import Toast from 'react-native-toast-message';
import { CommentType } from './CommentSection';

type Props = {
    entityId: string;
    entityType: 'news' | 'event';
    onCommentAdded: (c: CommentType) => void;
};

export function CommentInput({ entityId, entityType, onCommentAdded }: Props) {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { getToken } = useAuth();
    const maxChars = 500;

    const handlePost = async () => {
        if (!content.trim()) return;
        if (content.length > maxChars) return;

        setSubmitting(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("Não logado.");

            const payload = {
                content: content.trim(),
                newsId: entityType === 'news' ? entityId : undefined,
                eventId: entityType === 'event' ? entityId : undefined,
            };

            const response = await api.post('/comments', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setContent('');
            onCommentAdded(response.data.comment);
            Toast.show({ type: 'success', text1: 'Comentário publicado!' });
        } catch (e: any) {
            Toast.show({ type: 'error', text1: e.message || 'Erro ao publicar.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className="mb-2">
            <View className="flex-row items-end bg-gray-50 border border-gray-200 rounded-3xl pt-2 pb-2 pl-4 pr-2 shadow-sm shadow-gray-100">
                <TextInput
                    className="flex-1 min-h-[40px] max-h-[120px] text-gray-800 text-[15px] font-[Inter_400Regular] pb-2"
                    placeholder="O que você achou?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={maxChars}
                    value={content}
                    onChangeText={setContent}
                    style={{ textAlignVertical: 'top' }}
                />

                <TouchableOpacity
                    onPress={handlePost}
                    disabled={!content.trim() || submitting}
                    className={`w-10 h-10 rounded-full items-center justify-center ${content.trim() ? 'bg-green-600' : 'bg-gray-200'} ml-2`}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <FontAwesome name="paper-plane" size={16} color={content.trim() ? "#FFF" : "#9CA3AF"} style={{ marginLeft: -2, marginTop: 2 }} />
                    )}
                </TouchableOpacity>
            </View>

            {content.length > 0 && (
                <Text className={`text-xs text-right mt-1.5 mr-2 font-[Inter_500Medium] ${content.length >= maxChars ? 'text-red-500' : 'text-gray-400'}`}>
                    {content.length}/{maxChars}
                </Text>
            )}
        </View>
    );
}
