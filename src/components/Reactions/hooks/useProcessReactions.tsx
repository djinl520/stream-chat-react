import { useCallback, useMemo } from 'react';

import { useComponentContext, useMessageContext } from '../../../context';

import type { ReactionsListProps } from '../ReactionsList';
import type { DefaultStreamChatGenerics } from '../../../types/types';

type SharedReactionListProps =
  | 'own_reactions'
  | 'reaction_counts'
  | 'reactionOptions'
  | 'reactions';

type UseProcessReactionsParams = Pick<ReactionsListProps, SharedReactionListProps>;

export const useProcessReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UseProcessReactionsParams,
) => {
  const {
    own_reactions: propOwnReactions,
    reaction_counts: propReactionCounts,
    reactionOptions: propReactionOptions,
    reactions: propReactions,
  } = params;
  const { message } = useMessageContext<StreamChatGenerics>('useProcessReactions');
  const { reactionOptions: contextReactionOptions } = useComponentContext<StreamChatGenerics>(
    'useProcessReactions',
  );

  const reactionOptions = propReactionOptions ?? contextReactionOptions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const latestReactions = propReactions || message.latest_reactions || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ownReactions = propOwnReactions || message?.own_reactions || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reactionCounts = propReactionCounts || message.reaction_counts || {};

  const iHaveReactedWithReaction = useCallback(
    (reactionType: string) => ownReactions.find((reaction) => reaction.type === reactionType),
    [ownReactions],
  );

  const getEmojiByReactionType = useCallback(
    (reactionType: string) => reactionOptions.find(({ type }) => type === reactionType),
    [reactionOptions],
  );

  const latestReactionTypes = useMemo(
    () =>
      latestReactions.reduce<string[]>((reactionTypes, { type }) => {
        if (reactionTypes.indexOf(type) === -1) {
          reactionTypes.push(type);
        }
        return reactionTypes;
      }, []),
    [latestReactions],
  );

  const supportedReactionMap = useMemo(
    () =>
      reactionOptions.reduce<Record<string, boolean>>((map, { type: reactionType }) => {
        map[reactionType] = true;
        return map;
      }, {}),
    [reactionOptions],
  );

  const supportedReactionsArePresent = useMemo(
    () => latestReactionTypes.some((reactionType) => supportedReactionMap[reactionType]),
    [latestReactionTypes, supportedReactionMap],
  );

  const totalReactionCount = useMemo(
    () =>
      supportedReactionsArePresent
        ? Object.values(reactionCounts).reduce((total, count) => total + count, 0)
        : 0,
    [reactionCounts, supportedReactionsArePresent],
  );

  const aggregatedUserNamesByType = useMemo(
    () =>
      latestReactions.reduce<Record<string, Array<string>>>((typeMap, { type, user }) => {
        typeMap[type] ??= [];

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        typeMap[type].push(user?.name || user!.id);
        return typeMap;
      }, {}),
    [latestReactions],
  );

  return {
    aggregatedUserNamesByType,
    getEmojiByReactionType,
    iHaveReactedWithReaction,
    latestReactions,
    latestReactionTypes,
    reactionCounts,
    supportedReactionsArePresent,
    totalReactionCount,
  };
};
