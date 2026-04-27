import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '@/lib/api';
import Toast from 'react-native-toast-message';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';

type CommentSectionProps = {
    entityId: string;
    entityType: 'news' | 'event';
};

export type CommentType = {
    id: string;
    content: string;
    userId: string;
    user: { id: string; clerkId: string; firstName?: string | null; lastName?: string | null; imageUrl?: string | null };
    createdAt: string;
    reactions: Array<{ type: 'LIKE' | 'DISLIKE', userId: string }>;
    isReported: boolean;
    isEdited: boolean;
};

export function CommentSection({ entityId, entityType }: CommentSectionProps) {
    const [comments, setComments] = useState<CommentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchComments = async (pageNum = 1) => {
        try {
            const response = await api.get(`/comments`, {
                params: { type: entityType, id: entityId, page: pageNum }
            });
            const newComments = response.data.comments;
            if (pageNum === 1) {
                setComments(newComments);
            } else {
                setComments(prev => [...prev, ...newComments]);
            }
            setHasMore(newComments.length === 5);
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Erro ao carregar comentários' });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchComments(1);
    }, [entityId]);

    const loadMore = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchComments(nextPage);
    };

    const onCommentAdded = (newComment: CommentType) => {
        setComments(prev => [newComment, ...prev]);
    };

    const onCommentDeleted = (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    return (
        <View className="mt-8 pt-6 border-t border-gray-100">
            <Text className="text-2xl font-[Inter_800ExtraBold] text-gray-900 mb-6 px-1">
                Comentários
            </Text>

            <CommentInput entityId={entityId} entityType={entityType} onCommentAdded={onCommentAdded} />

            {loading ? (
                <ActivityIndicator size="small" color="#166534" className="mt-6" />
            ) : comments.length === 0 ? (
                <View className="items-center py-10 bg-gray-50 rounded-2xl border border-gray-100/50 mt-6">
                    <Text className="text-gray-400 font-[Inter_500Medium] text-base">Nenhum comentário ainda.</Text>
                    <Text className="text-gray-300 font-[Inter_400Regular] text-sm mt-1">Seja o primeiro a compartilhar sua opinião!</Text>
                </View>
            ) : (
                <View className="mt-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onDeleted={onCommentDeleted}
                        />
                    ))}

                    {hasMore && (
                        <TouchableOpacity onPress={loadMore} className="py-5 items-center mt-2 bg-gray-50 rounded-xl" activeOpacity={0.7}>
                            {loadingMore ? (
                                <ActivityIndicator size="small" color="#166534" />
                            ) : (
                                <Text className="text-green-700 font-[Inter_600SemiBold] text-[15px]">Carregar mais comentários</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
