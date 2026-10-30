import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../Constants/Colors';
import { useI18n } from '../../i18n';
import { SkeletonCardList } from '../../Components/Skeleton';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import DatePickerModal, { formatDisplayDate } from '../../Components/DatePickerModal';

const MAX_LENGTH = 5000;
// Cards show this many lines; longer notes get a Read more / Show less toggle.
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
    if (!value) return;
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

  const total = notes.length;

  // Latest note date first, within the chosen date range.
  const visible = notes
    .filter(n => {
      const key = getNoteDate(n);
      if (fromDate && key < fromDate) return false;
      if (toDate && key > toDate) return false;
      return true;
    })
    .slice()
    .sort((a, b) => getNoteDate(b).localeCompare(getNoteDate(a)) || b.createdAt - a.createdAt);

  const fmtDate = ms =>
    new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderNote = ({ item }) => (
    <View style={styles.noteCard}>
      <View style={styles.accent} />
      <View style={styles.noteInner}>
        <Text
          style={styles.noteText}
          numberOfLines={expanded[item.id] ? undefined : PREVIEW_LINES}
        >
          {item.text}
        </Text>
        {isLong(item.text) && (
          <TouchableOpacity
            onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
          >
            <Text style={styles.readMore}>
              {expanded[item.id] ? t('notesShowLess') : t('notesReadMore')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.noteBottom}>
          <Text style={styles.noteDate}>
            {fmtDate(parseLocalDate(getNoteDate(item)).getTime())}
            {item.updatedAt && item.updatedAt !== item.createdAt ? ' · edited' : ''}
            {item.synced === false ? ` · ${t('notesNotSynced')}` : ''}
          </Text>
          <View style={styles.noteActions}>
            <TouchableOpacity style={styles.editChip} onPress={() => openEdit(item)}>
              <Text style={styles.editChipText}>✎ {t('notesEdit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" translucent={true} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('goBack')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notes')}</Text>
          <View style={styles.placeholderButton} />
        </View>

        <FlatList
          data={visible}
          keyExtractor={item => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Date range */}
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
                {(!!fromDate || !!toDate) && (
                  <TouchableOpacity
                    style={styles.dateClear}
                    onPress={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                  >
                    <Text style={styles.clearText}>{t('notesClear')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            !loaded ? (
              <SkeletonCardList count={3} withImage={false} />
            ) : (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>✎</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {total === 0 ? t('notesEmptyTitle') : t('notesNoMatch')}
                </Text>
                <Text style={styles.emptyText}>
                  {total === 0 ? t('notesEmptyText') : ''}
                </Text>
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
        <TouchableOpacity style={styles.fab} onPress={openNew} activeOpacity={0.85}>
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabText}>{t('notesNew')}</Text>
        </TouchableOpacity>

        {/* Add / edit: full-screen editor with room for long notes */}
        <Modal
          animationType="slide"
          visible={editor !== null}
          onRequestClose={closeEditor}
          statusBarTranslucent
        >
          <View
            style={[
              styles.editorScreen,
              { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 48 },
            ]}
          >
            <View style={styles.editorBar}>
              <TouchableOpacity style={styles.editorClose} onPress={closeEditor}>
                <Text style={styles.editorCloseText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.editorTitle}>
                {editor && editor.id ? t('notesEditTitle') : t('notesNew')}
              </Text>
              <TouchableOpacity
                style={[styles.editorSave, !draft.trim() && styles.editorSaveDisabled]}
                onPress={saveEditor}
                disabled={!draft.trim()}
              >
                <Text style={styles.editorSaveText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.editorDate}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setEditorDatePicker(true);
              }}
            >
              <Text style={styles.editorDateIcon}>📅</Text>
              <View style={styles.editorDateText}>
                <Text style={styles.sheetDateLabel}>{t('notesDateLabel')}</Text>
                <Text style={styles.sheetDateValue}>{formatDisplayDate(draftDate)}</Text>
              </View>
              <Text style={styles.editorDateChange}>{t('notesChangeDate')}</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.editorInput}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('notesPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={MAX_LENGTH}
              autoFocus
              scrollEnabled
            />

            <View style={[styles.editorFooter, { marginBottom: keyboardHeight }]}>
              <Text style={styles.counter}>
                {draft.trim() ? draft.trim().split(/\s+/).length : 0} {t('notesWords')} · {draft.length}/{MAX_LENGTH}
              </Text>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    color: Colors.primary,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  placeholderButton: { width: 44 },
  listContent: { paddingHorizontal: wp('5%'), paddingTop: 16, paddingBottom: 110, flexGrow: 1 },

  dateRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 12 },
  dateField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dateLabel: { fontSize: 11, color: '#9CA3AF' },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  datePlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  clearText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  dateClear: { justifyContent: 'center', paddingHorizontal: 4 },

  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  accent: { width: 5, backgroundColor: Colors.primary },
  noteInner: { flex: 1, padding: 14 },
  noteText: { fontSize: 15, color: '#1F2937', lineHeight: 22 },
  noteBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F7',
  },
  noteDate: { fontSize: 11, color: '#9CA3AF' },
  noteActions: { flexDirection: 'row', gap: 8 },
  editChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#EEF3FF',
  },
  editChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  emptyBox: { alignItems: 'center', paddingVertical: hp('7%'), paddingHorizontal: 30 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: { fontSize: 28, color: Colors.primary },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: wp('5%'),
    bottom: hp('3%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 22, fontWeight: '600', marginRight: 8, lineHeight: 24 },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  editorScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  editorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editorClose: { paddingVertical: 8, paddingRight: 12 },
  editorCloseText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  editorTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  editorSave: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  editorSaveDisabled: { opacity: 0.4 },
  editorSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  editorDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F4F6FB',
  },
  editorDateIcon: { fontSize: 20, marginRight: 12 },
  editorDateText: { flex: 1 },
  editorDateChange: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  editorInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    fontSize: 16,
    lineHeight: 25,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  editorFooter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F7',
    backgroundColor: '#FFFFFF',
  },
  readMore: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 6 },
  sheetDateLabel: { fontSize: 12, color: '#9CA3AF' },
  sheetDateValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: '#9CA3AF' },
});
