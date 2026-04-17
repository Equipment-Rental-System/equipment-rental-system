import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { api, buildUploadUrl } from "../../api/client";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import LoadingView from "../../components/LoadingView";
import Screen from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

export default function PendingUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/users/pending", token);
      setUsers(data);
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleAction = async (userId, action) => {
    try {
      await api.post(`/admin/users/${userId}/${action}`, {}, token);
      await loadUsers();
    } catch (error) {
      Alert.alert("오류", error.data?.message || error.message);
    }
  };

  return (
    <Screen>
      {loading ? (
        <LoadingView text="승인 대기 회원을 불러오는 중입니다." />
      ) : users.length ? (
        users.map((item) => (
          <Card key={item.id}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.studentId} · {item.department}</Text>
            {item.studentCardImagePath ? (
              <Image source={{ uri: buildUploadUrl(item.studentCardImagePath) }} style={styles.image} />
            ) : null}
            <View style={styles.actions}>
              <AppButton title="승인" onPress={() => handleAction(item.id, "approve")} />
              <AppButton title="거절" variant="danger" onPress={() => handleAction(item.id, "reject")} />
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.meta}>승인 대기 중인 회원이 없습니다.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.muted,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
});
