import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';

import { Colors } from '../../Constants/Colors';
import { useI18n } from '../../i18n';
import { SkeletonCardList } from '../../Components/Skeleton';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { confirmAction } from '../../utils/appModal';
import DatePickerModal, { formatDisplayDate } from '../../Components/DatePickerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_LENGTH = 5000;
// Cards show this many lines; longer notes get a Read more / Show less toggle.
// Each note gets a small coloured tile; a given note always keeps the same one.
const TILE_COLORS = [
  { bg: '#E0ECFF', fg: '#2563EB' },
  { bg: '#DCFCE7', fg: '#16A34A' },
  { bg: '#FEF3C7', fg: '#D97706' },
  { bg: '#FCE7F3', fg: '#DB2777' },
  { bg: '#EDE9FE', fg: '#7C3AED' },
  { bg: '#CFFAFE', fg: '#0891B2' },
];
const tileColor = id =>
  TILE_COLORS[
    String(id)
      .split('')
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TILE_COLORS.length
  ];
const PREVIEW_LINES = 5;
const LONG_NOTE_CHARS = 180;

// "YYYY-MM-DD" in local time for a timestamp, to compare with the date picker.
const toDateKey = ms => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// The date a note belongs to (picked in the editor). Older notes didn't have
// one, so they fall back to the day they were created.
const getNoteDate = n => n.noteDate || toDateKey(n.createdAt);
const isLong = text => text.length > LONG_NOTE_CHARS || text.split('\n').length > PREVIEW_LINES;
const parseLocalDate = v => {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Personal notes / to-dos, stored on the device per member (no server call).
export default function NotesScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { t } = useI18n();
  const user = useSelector(state => state.auth.user) || {};
  const storageKey = `rmta_notes_${user.member_id || user.user_id || 'guest'}`;

  const [notes, setNotes] = useState([]); // { id, text, done, createdAt, updatedAt }
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState({}); // { [noteId]: true }
  // Editor popup: null = closed, { id: null } = new note, { id } = editing.
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState('');
  // The date the note being written is for ("YYYY-MM-DD").
  const [draftDate, setDraftDate] = useState(() => toDateKey(Date.now()));
  const [editorDatePicker, setEditorDatePicker] = useState(false);
  // Date range filter on the note's created date ('' = not set).
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pickerFor, setPickerFor] = useState(null); // 'from' | 'to' | null
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('all'); // 'all' | 'today' | 'week' | 'custom'
  // Height of the on-screen keyboard, so the editor sheet sits above it. A
  // KeyboardAvoidingView doesn't resize inside a Modal on Android.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      let local = [];
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        local = raw ? JSON.parse(raw) : [];
      } catch (e) {
        // start with an empty list
      }

      // POST /public_app/getnotes { member_id } — the server's notes are the
      // source of truth; notes still waiting to be sent stay on top of them.
      let merged = local;
      try {
        const { response, data } = await postJson(ENDPOINTS.GET_NOTES, {
          member_id: user.member_id,
        });
        if (response.ok && data && Array.isArray(data.data)) {
          // Notes that haven't reached the server (new, edited, or created
          // before sync existed) are kept as they are and sent again below.
          const pending = local
            .filter(n => n.synced !== true)
            .map(n => ({ ...n, synced: false }));
          const pendingServerIds = new Set(pending.map(n => n.serverId).filter(Boolean));
          const fromServer = data.data
            .filter(row => !pendingServerIds.has(String(row.id)))
            .map(row => {
              const date = String(row.notes_date || '').slice(0, 10);
              const created = row.i_ts ? new Date(row.i_ts).getTime() : NaN;
              return {
                id: `s${row.id}`,
                serverId: String(row.id),
                text: row.description || '',
                noteDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
                done: false,
                createdAt: Number.isNaN(created) ? Date.now() : created,
                updatedAt: Number.isNaN(created) ? Date.now() : created,
                synced: true,
              };
            });
          merged = [...pending, ...fromServer];
          try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
          } catch (e) {
            // cache is best-effort
          }
        }
      } catch (e) {
        // offline: show what's on the phone
      }
      setNotes(merged);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Sends a note to the server and resolves { ok, serverId }.
  //   - new note (no serverId):  POST createnotes { member_id, description, notes_date }
  //     — the server's insertId is kept as the note's serverId.
  //   - already on the server:   POST editnotes  { notesid, member_id, description, notes_date }
  const syncNote = useCallback(
    async note => {
      const fields = {
        member_id: user.member_id,
        description: note.text,
        notes_date: note.noteDate || toDateKey(note.createdAt),
      };
      try {
        if (note.serverId) {
          const { response, data } = await postJson(ENDPOINTS.EDIT_NOTES, {
            notesid: note.serverId,
            ...fields,
          });
          return {
            ok: response.ok && !(data && data.success === false),
            serverId: note.serverId,
          };
        }
        const { response, data } = await postJson(ENDPOINTS.CREATE_NOTES, fields);
        const result = data && (data.data || data);
        return {
          ok: response.ok && !(data && data.success === false),
          serverId: result && (result.insertId || result.notesid || result.id) ? String(result.insertId || result.notesid || result.id) : null,
        };
      } catch (e) {
        return { ok: false, serverId: note.serverId || null };
      }
    },
    [user.member_id],
  );

  const persist = useCallback(
    async next => {
      setNotes(next);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        // the list still works for this session
      }
    },
    [storageKey],
  );

  // When the screen opens, try again to send any notes that failed earlier.
  useEffect(() => {
    if (!loaded) return;
    const pending = notes.filter(n => n.synced === false);
    if (pending.length === 0) return;
    (async () => {
      let next = notes;
      for (const note of pending) {
        const result = await syncNote(note);
        if (result.ok) {
          next = next.map(n =>
            n.id === note.id ? { ...n, synced: true, serverId: result.serverId || n.serverId } : n,
          );
        }
      }
      if (next !== notes) persist(next);
    })();
    // Only on first load; later saves handle their own sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const openNew = () => {
    setDraft('');
    setDraftDate(toDateKey(Date.now()));
    setEditor({ id: null });
  };

  const openEdit = note => {
    setDraft(note.text);
    setDraftDate(getNoteDate(note));
    setEditor({ id: note.id });
  };

  const closeEditor = () => {
    setEditor(null);
    setDraft('');
  };

  const saveEditor = async () => {
    const value = draft.trim();
    if (!value) {
      Alert.alert('Note required', 'Please enter some details to save this note.');
      return;
    }
    if (editor && editor.id) {
      const editedId = editor.id;
      const edited = {
        ...notes.find(n => n.id === editedId),
        text: value,
        noteDate: draftDate,
        updatedAt: Date.now(),
        synced: false,
      };
      closeEditor();
      // Save the edit on the phone, then send it (editnotes if the note is
      // already on the server, otherwise createnotes).
      let next = notes.map(n => (n.id === editedId ? edited : n));
      await persist(next);
      const result = await syncNote(edited);
      if (result.ok) {
        next = next.map(n =>
          n.id === editedId ? { ...n, synced: true, serverId: result.serverId || n.serverId } : n,
        );
        persist(next);
      } else {
        Alert.alert(t('notesSyncFailedTitle'), t('notesSyncFailedText'));
      }
      return;
    } else {
      const now = Date.now();
      const note = {
        id: String(now),
        text: value,
        noteDate: draftDate,
        done: false,
        createdAt: now,
        updatedAt: now,
        synced: false,
      };
      closeEditor();
      // Save on the phone first so the note is never lost, then send it to the
      // server and mark it synced.
      let next = [note, ...notes];
      await persist(next);
      const result = await syncNote(note);
      if (result.ok) {
        next = next.map(n =>
          n.id === note.id ? { ...n, synced: true, serverId: result.serverId } : n,
        );
        persist(next);
      } else {
        Alert.alert(t('notesSyncFailedTitle'), t('notesSyncFailedText'));
      }
      return;
    }
  };

  // Delete a note: ask first, then POST delcreatenotes { member_id, note_id } for notes that
  // are on the server. A note that never reached the server is only removed from the phone.
  // If the server refuses, the note is kept.
  const handleDelete = note => {
    confirmAction({
      title: 'Delete note?',
      message: 'This note will be permanently deleted.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        if (note.serverId) {
          try {
            const { response, data } = await postJson(ENDPOINTS.DELETE_NOTES, {
              member_id: user.member_id,
              note_id: note.serverId,
            });
            if (!response.ok || (data && data.success === false)) {
              Alert.alert('Could not delete', (data && (data.message || data.msg)) || 'Please try again.');
              return;
            }
          } catch (e) {
            Alert.alert('Could not delete', e.message || 'Please try again.');
            return;
          }
        }
        persist(notes.filter(n => n.id !== note.id));
      },
    });
  };

  const total = notes.length;
  const todayKey = toDateKey(Date.now());
  const yesterdayKey = toDateKey(Date.now() - 24 * 60 * 60 * 1000);

  const chooseRange = key => {
    setRange(key);
    if (key === 'all') {
      setFromDate('');
      setToDate('');
    } else if (key === 'today') {
      setFromDate(todayKey);
      setToDate(todayKey);
    } else if (key === 'week') {
      setFromDate(toDateKey(Date.now() - 6 * 24 * 60 * 60 * 1000));
      setToDate('');
    }
  };

  // Matching notes, newest day first, then split into one section per day.
  const q = query.trim().toLowerCase();
  const filtered = notes
    .filter(n => {
      const key = getNoteDate(n);
      if (fromDate && key < fromDate) return false;
      if (toDate && key > toDate) return false;
      if (q && !n.text.toLowerCase().includes(q)) return false;
      return true;
    })
    .slice()
    .sort((a, b) => getNoteDate(b).localeCompare(getNoteDate(a)) || b.createdAt - a.createdAt);

  // "Today", "Yesterday", or "Monday, 27 Oct".
  const dayTitle = key => {
    if (key === todayKey) return 'Today';
    if (key === yesterdayKey) return 'Yesterday';
    return parseLocalDate(key).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const sections = [];
  filtered.forEach(n => {
    const key = getNoteDate(n);
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.data.push(n);
    else sections.push({ key, title: dayTitle(key), data: [n] });
  });

  const timeOf = ms =>
    new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // First line is the title, the rest is the preview.
  const renderNote = ({ item, index, section }) => {
    const lines = item.text.trim().split('\n');
    const title = lines[0].trim() || 'New note';
    const rest = lines.slice(1).join(' ').trim();
    const first = index === 0;
    const last = index === section.data.length - 1;
    const tile = tileColor(item.id);
    const edited = item.updatedAt && item.updatedAt !== item.createdAt;
    return (
      <TouchableOpacity
        style={[styles.row, first && styles.rowFirst, last && styles.rowLast]}
        activeOpacity={0.65}
        onPress={() => openEdit(item)}
      >
        <View style={[styles.tile, { backgroundColor: tile.bg }]}>
          <Text style={[styles.tileGlyph, { color: tile.fg }]}>{edited ? '✎' : '≡'}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.rowTime}>{timeOf(item.updatedAt || item.createdAt)}</Text>
          </View>
          <Text style={styles.rowPreview} numberOfLines={2}>
            {rest || 'No additional text'}
          </Text>
          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.8}>
              <Text style={styles.actionEditText}>✎  {t('notesEdit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDelete]}
              onPress={() => handleDelete(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionDeleteText}>🗑  Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        {item.synced === false && <Text style={styles.rowPending}>⏳</Text>}
        {!last && <View style={styles.rowDivider} />}
      </TouchableOpacity>
    );
  };

  const segments = [
    ['all', 'All'],
    ['today', 'Today'],
    ['week', '7 days'],
    ['custom', 'Dates'],
  ];

  const header = (
    <View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search your notes"
          placeholderTextColor="#9AA3B2"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {!!query && Platform.OS !== 'ios' && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.segment}>
        {segments.map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.segmentItem, range === key && styles.segmentItemOn]}
            onPress={() => chooseRange(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, range === key && styles.segmentTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {range === 'custom' && (
        <View style={styles.dateRow}>
          {[
            ['from', t('notesFrom'), fromDate],
            ['to', t('notesTo'), toDate],
          ].map(([key, label, value]) => (
            <TouchableOpacity
              key={key}
              style={styles.dateField}
              activeOpacity={0.7}
              onPress={() => setPickerFor(key)}
            >
              <Text style={styles.dateLabel}>{label}</Text>
              <Text style={[styles.dateValue, !value && styles.datePlaceholder]}>
                {formatDisplayDate(value) || t('notesSelect')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const editorDateText = (() => {
    if (draftDate === todayKey) return 'Today';
    if (draftDate === yesterdayKey) return 'Yesterday';
    return formatDisplayDate(draftDate);
  })();

  return (
    <>
      <StatusBar backgroundColor="#EEF2FF" barStyle="dark-content" translucent={true} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Soft decorative circles behind the header */}
        <View pointerEvents="none" style={styles.blobOne} />
        <View pointerEvents="none" style={styles.blobTwo} />

        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('goBack')} style={styles.backBtn} hitSlop={8}>
            <View style={styles.backCircle}>
              <Text style={styles.backChevron}>‹</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {total} {total === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        </View>
        <Text style={styles.largeTitle}>{t('notes')}</Text>
        <Text style={styles.subTitle}>Jot it down before you forget</Text>

        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderNote}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={
            !loaded ? (
              <SkeletonCardList count={3} withImage={false} />
            ) : (
              <View style={styles.emptyBox}>
                <View style={styles.emptyRingOuter}>
                  <View style={styles.emptyRingInner}>
                    <Text style={styles.emptyIconText}>📝</Text>
                  </View>
                </View>
                <Text style={styles.emptyTitle}>
                  {total === 0 ? t('notesEmptyTitle') : t('notesNoMatch')}
                </Text>
                {total === 0 && <Text style={styles.emptyText}>{t('notesEmptyText')}</Text>}
                {total === 0 && (
                  <TouchableOpacity style={styles.emptyBtn} onPress={openNew} activeOpacity={0.85}>
                    <Text style={styles.emptyBtnText}>＋  {t('notesNew')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />

        <DatePickerModal
          visible={pickerFor !== null}
          value={pickerFor === 'from' ? fromDate : toDate}
          minDate={pickerFor === 'to' && fromDate ? parseLocalDate(fromDate) : null}
          maxDate={pickerFor === 'from' && toDate ? parseLocalDate(toDate) : null}
          onConfirm={date => {
            if (pickerFor === 'from') setFromDate(date);
            else setToDate(date);
            setPickerFor(null);
          }}
          onClose={() => setPickerFor(null)}
        />

        {/* New note */}
        <TouchableOpacity style={styles.fab} onPress={openNew} activeOpacity={0.88} accessibilityLabel={t('notesNew')}>
          <Text style={styles.fabPlus}>＋</Text>
        </TouchableOpacity>

        {/* Add / edit: a bottom sheet over a dimmed screen */}
        <Modal
          animationType="slide"
          transparent
          visible={editor !== null}
          onRequestClose={closeEditor}
          statusBarTranslucent
        >
          <View style={styles.scrim}>
            {/* Tapping the dim area above the sheet closes it */}
            <TouchableOpacity style={styles.scrimTap} activeOpacity={1} onPress={closeEditor} />
            <View
              style={[
                styles.sheet,
                {
                  height: Math.min(windowHeight * 0.86, windowHeight - insets.top - 16 - keyboardHeight),
                  marginBottom: keyboardHeight,
                  paddingBottom: keyboardHeight ? 14 : Math.max(insets.bottom, 14),
                },
              ]}
            >
              <View style={styles.grabber} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetIcon}>
                  <Text style={styles.sheetIconText}>{editor && editor.id ? '✎' : '＋'}</Text>
                </View>
                <View style={styles.sheetTitles}>
                  <Text style={styles.sheetTitle}>{editor && editor.id ? t('notesEditTitle') : t('notesNew')}</Text>
                  <Text style={styles.sheetSub}>Write it down, it saves to your account</Text>
                </View>
                <TouchableOpacity style={styles.sheetClose} onPress={closeEditor} hitSlop={8}>
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Which day the note is for */}
              <View style={styles.dayRow}>
                {[
                  [todayKey, 'Today'],
                  [yesterdayKey, 'Yesterday'],
                ].map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dayChip, draftDate === key && styles.dayChipOn]}
                    onPress={() => setDraftDate(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayChipText, draftDate === key && styles.dayChipTextOn]}>{label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.dayChip, draftDate !== todayKey && draftDate !== yesterdayKey && styles.dayChipOn]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setEditorDatePicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      draftDate !== todayKey && draftDate !== yesterdayKey && styles.dayChipTextOn,
                    ]}
                  >
                    📅 {draftDate !== todayKey && draftDate !== yesterdayKey ? formatDisplayDate(draftDate) : 'Pick date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* The note */}
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.sheetInput}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t('notesPlaceholder')}
                  placeholderTextColor="#A8B0C0"
                  multiline
                  maxLength={MAX_LENGTH}
                  autoFocus
                  scrollEnabled
                />
                <Text style={styles.sheetCounter}>
                  {draft.trim() ? draft.trim().split(/\s+/).length : 0} {t('notesWords')}  ·  {draft.length}/{MAX_LENGTH}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, !draft.trim() && styles.saveBtnOff]}
                onPress={saveEditor}
                disabled={!draft.trim()}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>{editor && editor.id ? t('save') : `${t('save')} note`}</Text>
              </TouchableOpacity>
            </View>

            <DatePickerModal
              visible={editorDatePicker}
              value={draftDate}
              minDate={null}
              onConfirm={date => {
                setDraftDate(date);
                setEditorDatePicker(false);
              }}
              onClose={() => setEditorDatePicker(false)}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const ACCENT = Colors.secondary;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#EEF2FF' },
  blobOne: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#DDE6FF',
  },
  blobTwo: {
    position: 'absolute',
    top: 60,
    right: 70,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E6ECFF',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  backChevron: { color: Colors.primary, fontSize: 28, lineHeight: 30, includeFontPadding: false, marginTop: -2, marginLeft: -2 },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countPillText: { fontSize: 12, fontWeight: '800', color: ACCENT },
  largeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.2,
    paddingHorizontal: 22,
    marginTop: 14,
  },
  subTitle: { fontSize: 14, color: '#64748B', paddingHorizontal: 22, marginTop: 2, marginBottom: 14 },

  listContent: { paddingHorizontal: 18, paddingBottom: 120, flexGrow: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 15, color: '#0F172A' },
  searchClear: { fontSize: 14, color: '#94A3B8', paddingLeft: 8 },

  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99,115,160,0.14)',
    borderRadius: 13,
    padding: 3,
  },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  segmentItemOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  segmentTextOn: { color: Colors.primary },

  dateRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dateField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dateLabel: { fontSize: 11, color: '#94A3B8' },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  datePlaceholder: { color: '#94A3B8', fontWeight: '400' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10, marginLeft: 4 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', letterSpacing: 0.3, textTransform: 'uppercase' },

  row: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  rowFirst: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  rowLast: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  tile: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tileGlyph: { fontSize: 20, fontWeight: '800', includeFontPadding: false },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A', marginRight: 8 },
  rowTime: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  rowPreview: { fontSize: 13, lineHeight: 18, color: '#64748B', marginTop: 3 },
  rowPending: { fontSize: 13, marginLeft: 8 },
  rowActions: { flexDirection: 'row', marginTop: 10 },
  actionBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  actionEditText: { fontSize: 12, fontWeight: '800', color: ACCENT },
  actionDelete: { backgroundColor: '#FEE2E2' },
  actionDeleteText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  rowDivider: {
    position: 'absolute',
    left: 68,
    right: 14,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
  },

  emptyBox: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyRingOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyRingInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyIconText: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: ACCENT,
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingVertical: 13,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 9,
    elevation: 5,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 30,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 28, fontWeight: '400', includeFontPadding: false },

  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  scrimTap: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D7DCE6', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetIconText: { fontSize: 20, fontWeight: '800', color: ACCENT, includeFontPadding: false },
  sheetTitles: { flex: 1 },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: Colors.primary },
  sheetSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  dayChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  dayChipOn: { backgroundColor: ACCENT },
  dayChipText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  dayChipTextOn: { color: '#FFFFFF' },
  inputCard: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 14,
  },
  sheetInput: { flex: 1, fontSize: 17, lineHeight: 26, color: '#0F172A', textAlignVertical: 'top', padding: 0 },
  sheetCounter: { alignSelf: 'flex-end', fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 6 },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnOff: { opacity: 0.4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
