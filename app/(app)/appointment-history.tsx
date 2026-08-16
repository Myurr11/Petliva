import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Calendar, MoreVertical } from "@/components/icons";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { isAppointmentPast } from "@/lib/appointmentTime";

export default function AppointmentHistory() {
  const record = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId] : undefined));

  const past = (record?.vet.appointments ?? [])
    .filter((a) => a.completed || isAppointmentPast(a.date, a.time))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Appointment history</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.sub}>{record?.pet.name ? `${record.pet.name}'s past visits` : "Past visits"}</Text>

        {past.length === 0 ? (
          <Text style={styles.emptyText}>No past appointments yet.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {past.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => router.push({ pathname: "/(app)/appointment-detail", params: { appointmentId: a.id } })}
                style={styles.apptRow}
              >
                <View style={styles.apptIconWrap}>
                  <Calendar size={16} color={colors.inkSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apptDate}>
                    {new Date(a.date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    {a.time ? ` · ${a.time}` : ""}
                  </Text>
                  {!!(a.doctorName || a.hospitalName) && (
                    <Text style={styles.apptNote}>{[a.doctorName, a.hospitalName].filter(Boolean).join(" · ")}</Text>
                  )}
                  {(a.diagnosis && a.diagnosis.length > 0) && (
                    <Text style={styles.apptDiagnosis} numberOfLines={1}>{a.diagnosis.join(", ")}</Text>
                  )}
                </View>
                <MoreVertical size={18} color={colors.inkSoft} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20, marginTop: 4 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body, marginTop: 30 },
  apptRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  apptIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  apptDate: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  apptNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  apptDiagnosis: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accentDeep, marginTop: 3 },
});
