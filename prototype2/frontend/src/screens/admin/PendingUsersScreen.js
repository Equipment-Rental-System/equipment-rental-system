import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import StatusBadge from "../../components/StatusBadge";
import { api, buildUploadUrl } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";
import { formatDate, getErrorMessage } from "../../utils/helpers";

export default function PendingUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const rows = await api.get("/admin/users/pending", token);
      setUsers(rows);
    } catch (error) {
      Alert.alert("회원 승인 목록 조회 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [token])
  );

  const handleDecision = async (id, action) => {
    try {
      await api.post(`/admin/users/${id}/${action}`, {}, token);
      Alert.alert("처리 완료", action === "approve" ? "회원이 승인되었습니다." : "회원이 거절되었습니다.");
      loadUsers();
    } catch (error) {
      Alert.alert("처리 실패", getErrorMessage(error));
    }
  };

  if (loading) {
    return <LoadingView text="회원 승인 대기 목록을 불러오는 중입니다." />;
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>회원 승인 관리</Text>
        <Text style={styles.subtitle}>학생증 이미지를 확인한 뒤 승인 또는 거절을 진행하세요.</Text>
      </Card>

      {users.length === 0 ? (
        <Card>
          <Text style={styles.empty}>승인 대기 중인 회원이 없습니다.</Text>
        </Card>
      ) : (
        users.map((item) => (
          <Card key={item.id}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>학번: {item.studentId}</Text>
                <Text style={styles.meta}>학과: {item.department}</Text>
                <Text style={styles.meta}>신청일: {formatDate(item.createdAt)}</Text>
              </View>
              <StatusBadge status="PENDING" />
            </View>
            {item.studentCardImagePath ? (
              <Image source={{ uri: buildUploadUrl(item.studentCardImagePath) }} style={styles.image} />
            ) : null}
            <View style={styles.actions}>
              <AppButton title="승인" onPress={() => handleDecision(item.id, "approve")} />
              <AppButton title="거절" variant="danger" onPress={() => handleDecision(item.id, "reject")} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  empty: {
    color: theme.colors.muted,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#eef2f7",
  },
  actions: {
    gap: 10,
  },
});
