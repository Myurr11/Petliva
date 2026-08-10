import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Calendar } from "@/components/icons";
import { CalendarGrid } from "@/components/ui/CalendarGrid";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts } from "@/theme/tokens";

function formatDisplay(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  label: string;
  value: string; // ISO date, or ""
  onChange: (iso: string) => void;
  placeholder?: string;
}

/** A tappable field showing a chosen date, opening a calendar grid modal to
 *  pick one — the single reusable date-selection UI for the whole app,
 *  replacing free-text "YYYY-MM-DD" inputs. */
export function DateField({ label, value, onChange, placeholder = "Select a date" }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function openPicker() {
    setDraft(value);
    setOpen(true);
  }

  function confirm() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={openPicker} style={styles.field}>
        <Calendar size={17} color={colors.ink} />
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <CalendarGrid value={draft} onSelect={setDraft} />
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Done" onPress={confirm} disabled={!draft} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  field: {
    flexDirection: "row", alignItems: "center", gap: 10, width: "100%",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  fieldText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  fieldPlaceholder: { color: colors.outlineVariant },
  overlay: { flex: 1, backgroundColor: "rgba(28,27,27,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.appBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, marginBottom: 16 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 10 },
  cancelLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkSoft },
});
