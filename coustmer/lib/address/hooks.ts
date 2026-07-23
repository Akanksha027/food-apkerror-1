import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { addressApi } from '@/lib/address/api';
import type {
  CreateAddressPayload,
  SavedAddress,
  UpdateAddressPayload,
} from '@/lib/address/types';

export const addressKeys = {
  all: ['address'] as const,
  health: () => [...addressKeys.all, 'health'] as const,
  list: () => [...addressKeys.all, 'list'] as const,
  detail: (id: string) => [...addressKeys.all, 'detail', id] as const,
};

function invalidateAddressQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  queryClient.invalidateQueries({ queryKey: addressKeys.all });
}

/** GET /health */
export function useAddressServiceHealth(enabled = false) {
  return useQuery({
    queryKey: addressKeys.health(),
    queryFn: addressApi.health,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

/** GET /addresses */
export function useSavedAddresses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: addressApi.list,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

/** GET /addresses/:addressId */
export function useSavedAddress(
  addressId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: addressKeys.detail(addressId),
    queryFn: () => addressApi.getById(addressId),
    enabled: (options?.enabled ?? true) && Boolean(addressId),
  });
}

/** Default saved address helper. */
export function useDefaultSavedAddress(options?: { enabled?: boolean }) {
  const list = useSavedAddresses(options);
  const defaultAddress =
    list.data?.find((a) => a.isDefault) ?? list.data?.[0] ?? null;
  return { ...list, defaultAddress };
}

/** POST /addresses */
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressApi.create(payload),
    onSuccess: () => invalidateAddressQueries(queryClient),
  });
}

/** PUT /addresses/:addressId */
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      payload,
    }: {
      addressId: string;
      payload: UpdateAddressPayload;
    }) => addressApi.update(addressId, payload),
    onSuccess: (_data, vars) => {
      invalidateAddressQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: addressKeys.detail(vars.addressId),
      });
    },
  });
}

/** DELETE /addresses/:addressId */
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => addressApi.remove(addressId),
    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: addressKeys.list() });
      const previous = queryClient.getQueryData<SavedAddress[]>(
        addressKeys.list()
      );
      if (previous) {
        queryClient.setQueryData(
          addressKeys.list(),
          previous.filter((a) => a.id !== addressId)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(addressKeys.list(), context.previous);
      }
    },
    onSettled: () => invalidateAddressQueries(queryClient),
  });
}

/** PUT /addresses/:addressId/default */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => addressApi.setDefault(addressId),
    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: addressKeys.list() });
      const previous = queryClient.getQueryData<SavedAddress[]>(
        addressKeys.list()
      );
      if (previous) {
        queryClient.setQueryData(
          addressKeys.list(),
          previous.map((a) => ({ ...a, isDefault: a.id === addressId }))
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(addressKeys.list(), context.previous);
      }
    },
    onSettled: () => invalidateAddressQueries(queryClient),
  });
}
