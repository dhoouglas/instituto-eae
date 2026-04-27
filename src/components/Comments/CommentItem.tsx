import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import api from '@/lib/api';
import Toast from 'react-native-toast-message';
import { CommentType } from './CommentSection';

type Props = {
    comment: CommentType;
    onDeleted: (commentId: string) => void;
};

export function CommentItem({ comment, onDeleted }: Props) {
    const { user: currentUser } = useUser();
    const { getToken } = useAuth();

    const isMine = currentUser?.id === comment.user.clerkId;
    const isAdmin = currentUser?.publicMetadata?.role === "admin";

    const [likesCount, setLikesCount] = useState(comment.reactions?.filter(r => r.type === 'LIKE').length || 0);
    const [dislikesCount, setDislikesCount] = useState(comment.reactions?.filter(r => r.type === 'DISLIKE').length || 0);
    const [reactingTo, setReactingTo] = useState<'LIKE' | 'DISLIKE' | null>(null);

    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [savingEdit, setSavingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const authorName = comment.user.firstName
        ? `${comment.user.firstName} ${comment.user.lastName || ''}`.trim()
        : "Membro EAE";

    const authorInitials = comment.user.firstName
        ? comment.user.firstName.charAt(0).toUpperCase()
        : "E";

    const handleReact = async (type: 'LIKE' | 'DISLIKE') => {
        if (reactingTo) return;
        setReactingTo(type);
        try {
            const token = await getToken();
            const res = await api.post(`/comments/${comment.id}/react`, { type }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Updating UI dynamically without huge logic, just trusting response
            if (res.data?.reaction?.status === "removed") {
                if (type === 'LIKE') setLikesCount(c => Math.max(0, c - 1));
                else setDislikesCount(c => Math.max(0, c - 1));
                Toast.show({ type: "success", text1: "Reação removida." });
            } else {
                if (type === 'LIKE') { setLikesCount(c => c + 1); setDislikesCount(c => Math.max(0, c - 1)); }
                else { setDislikesCount(c => c + 1); setLikesCount(c => Math.max(0, c - 1)); }
                Toast.show({ type: "success", text1: "Reação adicionada!" });
            }
        } catch {
            Toast.show({ type: "error", text1: "Não foi possível registrar a curtida." });
        } finally {
            setReactingTo(null);
        }
    };

    const handleReport = () => {
        setShowMenu(false);
        Alert.alert("Denunciar", "Deseja relatar este comentário como inapropriado?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Denunciar",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await getToken();
                        await api.post(`/comments/${comment.id}/report`, {}, { headers: { Authorization: `Bearer ${token}` } });
                        Toast.show({ type: 'success', text1: 'Comentário denunciado aos administradores.' });
                    } catch {
                        Toast.show({ type: 'error', text1: 'Erro ao denunciar.' });
                    }
                }
            }
        ]);
    };

    const handleDelete = () => {
        setShowMenu(false);
        Alert.alert("Excluir", "Deseja apagar permanentemente?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Apagar", style: "destructive", onPress: async () => {
                    setIsDeleting(true);
                    try {
                        const token = await getToken();
                        await api.delete(`/comments/${comment.id}`, { headers: { Authorization: `Bearer ${token}` } });
                        onDeleted(comment.id);
                        Toast.show({ type: 'success', text1: 'Comentário apagado.' });
                    } catch {
                        setIsDeleting(false);
                        Toast.show({ type: 'error', text1: 'Erro ao apagar.' });
                    }
                }
            }
        ]);
    };

    const saveEdit = async () => {
        if (!editContent.trim()) return;
        setSavingEdit(true);
        try {
            const token = await getToken();
            await api.put(`/comments/${comment.id}`, { content: editContent }, { headers: { Authorization: `Bearer ${token}` } });
            comment.content = editContent; // local update
            setIsEditing(false);
            Toast.show({ type: 'success', text1: 'Atualizado.' });
        } catch {
            Toast.show({ type: 'error', text1: 'Erro ao editar comentário.' });
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <View className={`mb-5 pb-5 border-b border-gray-100 ${isDeleting ? 'opacity-50' : ''}`}>
            {isDeleting && (
                <View className="absolute z-50 top-0 left-0 right-0 bottom-0 items-center justify-center">
                    <ActivityIndicator size="small" color="#166534" />
                </View>
            )}
            <View className="flex-row items-start justify-between z-10">
                <View className="flex-row items-center flex-1">
                    {comment.user.imageUrl ? (
                        <Image source={{ uri: comment.user.imageUrl }} className="w-10 h-10 rounded-full mr-3 border border-gray-200" />
                    ) : (
                        <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3 border border-green-200">
                            <Text className="text-green-800 font-[Inter_700Bold]">
                                {authorInitials}
                            </Text>
                        </View>
                    )}

                    <View className="flex-1">
                        <Text className="text-sm font-[Inter_700Bold] text-gray-800">
                            {authorName} {isMine ? "(Você)" : ""}
                            {comment.isReported && isAdmin && <Text className="text-xs text-red-500 font-[Inter_600SemiBold] ml-1">• Denunciado</Text>}
                        </Text>
                        <Text className="text-xs text-gray-400 font-[Inter_400Regular] mt-0.5">
                            {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            {comment.isEdited && " • Editado"}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => setShowMenu(!showMenu)} className="p-3 -mr-3 -mt-2">
                    <FontAwesome name="ellipsis-h" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu InLine */}
            {showMenu && (
                <View className="absolute bg-white border border-gray-200 shadow-sm shadow-gray-200 rounded-xl mt-1 mb-3 px-3 py-1 right-0 top-10 z-50 min-w-[140px]">
                    {isMine && !isEditing && (
                        <TouchableOpacity onPress={() => { setShowMenu(false); setIsEditing(true); }} className="py-3 border-b border-gray-100">
                            <Text className="text-gray-700 font-[Inter_600SemiBold] text-center">Editar</Text>
                        </TouchableOpacity>
                    )}
                    {(isMine || isAdmin) && (
                        <TouchableOpacity onPress={handleDelete} className="py-3 border-b border-gray-100">
                            <Text className="text-red-500 font-[Inter_600SemiBold] text-center">Apagar</Text>
                        </TouchableOpacity>
                    )}
                    {!isMine && (
                        <TouchableOpacity onPress={handleReport} className="py-3">
                            <Text className="text-orange-500 font-[Inter_600SemiBold] text-center">Denunciar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {isEditing ? (
                <View className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                    <TextInput
                        value={editContent}
                        onChangeText={setEditContent}
                        multiline
                        maxLength={500}
                        autoFocus
                        className="text-[15px] font-[Inter_400Regular] text-gray-800 min-h-[60px]"
                        style={{ textAlignVertical: 'top' }}
                    />
                    <View className="flex-row justify-end mt-3 items-center">
                        <TouchableOpacity onPress={() => setIsEditing(false)} className="mr-4">
                            <Text className="text-gray-500 font-[Inter_600SemiBold]">Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveEdit} disabled={savingEdit} className="bg-green-600 px-4 py-2 rounded-full flex-row items-center">
                            {savingEdit ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-[Inter_600SemiBold]">Salvar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text className="text-[15px] font-[Inter_400Regular] text-gray-700 mt-3 leading-relaxed">
                    {comment.content}
                </Text>
            )}

            {/* Reações */}
            {!isEditing && (
                <View className="flex-row items-center mt-4">
                    <TouchableOpacity onPress={() => handleReact('LIKE')} disabled={reactingTo !== null} className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mr-3 border border-gray-200">
                        {reactingTo === 'LIKE' ? <ActivityIndicator size="small" color="#166534" /> : <FontAwesome name="thumbs-o-up" size={15} color="#166534" />}
                        <Text className="ml-1.5 text-xs text-green-800 font-[Inter_600SemiBold]">{likesCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleReact('DISLIKE')} disabled={reactingTo !== null} className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                        {reactingTo === 'DISLIKE' ? <ActivityIndicator size="small" color="#9CA3AF" /> : <FontAwesome name="thumbs-o-down" size={15} color="#9CA3AF" />}
                        <Text className="ml-1.5 text-xs text-gray-500 font-[Inter_600SemiBold]">{dislikesCount}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
