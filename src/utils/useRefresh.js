import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { Colors } from '../Constants/Colors';

// Pull-to-refresh for screens that load their data in effects.
//
//   const { tick, refreshControl } = useRefresh();
//   useEffect(() => { load(); }, [..., tick]);          // pulling down bumps `tick`
//   <ScrollView refreshControl={refreshControl}> ...    // or <FlatList refreshControl=... />
//
// The loaders don't report back when they finish, so the spinner stays for a short,
// fixed time after each pull.
export default function useRefresh(spinMs = 900) {
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick(t => t + 1);
    setTimeout(() => setRefreshing(false), spinMs);
  }, [spinMs]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.secondary}
      colors={[Colors.secondary]}
    />
  );

  return { tick, refreshing, onRefresh, refreshControl };
}
