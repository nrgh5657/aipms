package com.aipms.util;

import com.sun.management.OperatingSystemMXBean;

import java.io.File;
import java.lang.management.ManagementFactory;

public class SystemResourceUtil {

    public static double getCpuUsage() {
        OperatingSystemMXBean osBean =
                (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        return osBean.getSystemCpuLoad(); // 0.0 ~ 1.0
    }

    public static double getMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long used = runtime.totalMemory() - runtime.freeMemory();
        return (double) used / runtime.totalMemory();
    }

    public static double getDiskUsage() {
        File root = new File("/");
        long used = root.getTotalSpace() - root.getFreeSpace();
        return (double) used / root.getTotalSpace();
    }
}
