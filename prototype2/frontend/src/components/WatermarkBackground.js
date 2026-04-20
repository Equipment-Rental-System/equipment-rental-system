import { StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";

const SIZE = 420;

export default function WatermarkBackground() {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={styles.seal}>
        <View style={[styles.ring, styles.ringOne]} />
        <View style={[styles.ring, styles.ringTwo]} />
        <View style={[styles.ring, styles.ringThree]} />
        <View style={styles.centerCircle}>
          <Text style={styles.centerMark}>東</Text>
        </View>
        <Text style={styles.topText}>동국대학교</Text>
        <Text style={styles.bottomText}>DONGGUK UNIVERSITY</Text>
        <Text style={styles.yearText}>1906</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  seal: {
    position: "absolute",
    top: 70,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2.5,
    borderColor: theme.colors.watermark,
    opacity: 0.16,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: theme.colors.watermark,
  },
  ringOne: {
    inset: SIZE * 0.08,
    borderRadius: SIZE / 2,
  },
  ringTwo: {
    inset: SIZE * 0.16,
    borderRadius: SIZE / 2,
  },
  ringThree: {
    inset: SIZE * 0.24,
    borderRadius: SIZE / 2,
  },
  centerCircle: {
    width: SIZE * 0.34,
    height: SIZE * 0.34,
    borderRadius: SIZE * 0.17,
    borderWidth: 2.5,
    borderColor: theme.colors.watermark,
    alignItems: "center",
    justifyContent: "center",
  },
  centerMark: {
    color: theme.colors.watermark,
    fontWeight: "800",
    fontSize: SIZE * 0.14,
  },
  topText: {
    position: "absolute",
    top: SIZE * 0.1,
    color: theme.colors.watermark,
    fontWeight: "800",
    fontSize: SIZE * 0.075,
    letterSpacing: 1.2,
  },
  bottomText: {
    position: "absolute",
    bottom: SIZE * 0.11,
    color: theme.colors.watermark,
    fontWeight: "800",
    fontSize: SIZE * 0.055,
    letterSpacing: 1.2,
  },
  yearText: {
    position: "absolute",
    top: "44%",
    right: SIZE * 0.07,
    color: theme.colors.watermark,
    fontWeight: "800",
    fontSize: SIZE * 0.06,
    transform: [{ rotate: "90deg" }],
  },
});
