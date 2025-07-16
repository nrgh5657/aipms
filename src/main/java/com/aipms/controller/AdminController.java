package com.aipms.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
@Controller
@RequestMapping("management")
public class AdminController {

    @GetMapping("admin")
    public String admin() {
        return "admin-dashboard";
    }

    @GetMapping("fee")
    public String fee() {
        return "fee-management";
    }

    @GetMapping("parking")
    public String parking() {
        return "parking-management";
    }

    @GetMapping("parkingLog")
    public String parkingLog() {
        return "parking-log";
    }

    @GetMapping("fireManage")
    public String fire() {
        return "fire-management";
    }

    @GetMapping("fireCctv")
    public String fireCctv() {
        return "fire-cctv";
    }

    @GetMapping("member")
    public String member(){
        return "member-management";
    }

    @GetMapping("systemLogs")
    public String systemLog(){
        return "system-logs";
    }



}
