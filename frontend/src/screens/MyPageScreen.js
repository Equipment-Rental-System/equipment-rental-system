import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomTab from "../components/BottomTab";
import Header from "../components/Header";
import Page from "../components/Page";
import StatusBadge from "../components/StatusBadge";
import { styles } from "../styles/appStyles";

export default function MyPageScreen({
  user,
  rentals = [],
  notifications = [],
  adminRentals = [],
  adminIssues = [],
  onReadNotification,
  onBack,
  onGoHome,
}) {
  const isAdmin = user?.role === "ADMIN";

  return (
    <Page>
      <Header title={isAdmin ? "관리자 현황" : "마이페이지"} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.myScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name={isAdmin ? "shield-account" : "account"} size={34} color="#2f89ef" />
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName}>{user?.name || "사용자"}</Text>
            <Text style={styles.profileMeta}>학번/아이디: {user?.studentId || "-"}</Text>
            <Text style={styles.profileMeta}>{user?.department || "학과 정보 없음"}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{rentals.length}</Text>
            <Text style={styles.summaryLabel}>내 대여 내역</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{notifications.length}</Text>
            <Text style={styles.summaryLabel}>읽지 않은 알림</Text>
          </View>
        </View>

        <NotificationPanel notifications={notifications} onReadNotification={onReadNotification} />
        <RentalPanel title="내 대여 내역" rentals={rentals} emptyText="아직 대여 내역이 없습니다." />

        {isAdmin ? (
          <>
            <RentalPanel
              title="관리자 전체 대여 조회"
              rentals={adminRentals}
              emptyText="조회된 전체 대여 내역이 없습니다."
              showUser
            />
            <IssuePanel issues={adminIssues} />
          </>
        ) : null}
      </ScrollView>
      <BottomTab
        current="mypage"
        onChange={(key) => {
          if (key === "home") onGoHome();
        }}
      />
    </Page>
  );
}

function NotificationPanel({ notifications, onReadNotification }) {
  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHeaderRow}>
        <Text style={styles.sectionTitle}>알림</Text>
        <Text style={styles.panelCount}>{notifications.length}건</Text>
      </View>
      {notifications.length ? (
        notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationRow}>
            <View style={styles.rentalTextWrap}>
              <Text style={styles.rentalTitle}>{notification.title}</Text>
              <Text style={styles.rentalSub}>{notification.message}</Text>
              <Text style={styles.rentalSub}>{notification.createdAt}</Text>
            </View>
            <Pressable
              style={styles.smallActionButton}
              onPress={() => onReadNotification?.(notification.id)}
            >
              <Text style={styles.smallActionText}>읽음</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>새 알림이 없습니다.</Text>
      )}
    </View>
  );
}

function RentalPanel({ title, rentals, emptyText, showUser = false }) {
  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.panelCount}>{rentals.length}건</Text>
      </View>
      {rentals.length ? (
        rentals.map((rental) => (
          <View key={`${title}-${rental.id}`} style={styles.rentalRow}>
            <View style={styles.rentalTextWrap}>
              <Text style={styles.rentalTitle}>{rental.title}</Text>
              {showUser ? (
                <Text style={styles.rentalSub}>
                  {rental.userName || "사용자"} {rental.studentId ? `(${rental.studentId})` : ""}
                </Text>
              ) : null}
              <Text style={styles.rentalSub}>{rental.code}</Text>
              <Text style={styles.rentalSub}>{rental.period}</Text>
            </View>
            <StatusBadge
              status={
                rental.status === "REQUESTED"
                  ? "RENTAL_PENDING"
                  : rental.status === "APPROVED"
                    ? "RENTED"
                    : rental.status
              }
            />
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}
    </View>
  );
}

function IssuePanel({ issues }) {
  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHeaderRow}>
        <Text style={styles.sectionTitle}>이슈 로그</Text>
        <Text style={styles.panelCount}>{issues.length}건</Text>
      </View>
      {issues.length ? (
        issues.map((issue) => (
          <View key={issue.id} style={styles.issueRow}>
            <View style={styles.rentalTextWrap}>
              <Text style={styles.rentalTitle}>{issue.itemName}</Text>
              <Text style={styles.rentalSub}>
                {issue.userName || "사용자"} {issue.studentId ? `(${issue.studentId})` : ""}
              </Text>
              <Text style={styles.rentalSub}>{issue.description}</Text>
              <Text style={styles.rentalSub}>{issue.createdAt}</Text>
            </View>
            <View style={styles.issueBadge}>
              <Text style={styles.issueBadgeText}>{issue.issueType}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>등록된 이슈 로그가 없습니다.</Text>
      )}
    </View>
  );
}
