import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { http } from "./http";
import type { Ref } from "vue";

export interface Participant {
  _id: string;
  username: string;
  email: string;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  name?: string;
  participants: Participant[];
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string | { _id: string; username: string };
  content: string;
  read: boolean;
  isEdited: boolean;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await http.get("/conversations");
      return data.conversations as Conversation[];
    },
  });
}

export function useMessages(conversationId: Ref<string | null>) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await http.get(
        `/messages/${conversationId.value}?limit=50`,
      );
      return (data.data as Message[]).reverse();
    },
    enabled: () => !!conversationId.value, // only fetch when we have an ID
  });
}

export function useUsers(search: Ref<string>) {
  return useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const { data } = await http.get(`/users?search=${search.value}`);
      return data.data;
    },
    enabled: () => search.value.length > 0,
  });
}

// --- Mutations ---

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      await http.post(`/messages/${conversationId}`, { content });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
    },
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await http.post("/conversations/direct", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newMessage,
    }: {
      id: string;
      newMessage: string;
    }) => {
      await http.put(`/messages/${id}`, { newMessage });
    },
    onMutate: async ({ id, newMessage }) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previous = queryClient.getQueryData<Message[]>([
        "messages",
        conversationId,
      ]);

      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old) =>
          old?.map((m) =>
            m._id === id ? { ...m, content: newMessage, isEdited: true } : m,
          ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/messages/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previous = queryClient.getQueryData<Message[]>([
        "messages",
        conversationId,
      ]);

      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old) => old?.filter((m) => m._id !== id),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
    },
  });
}
