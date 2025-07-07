package com.aipms.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MemberController {

    @GetMapping("/login")
    public String login(){
        return "login";
    }

    @GetMapping("/signup")
    public String signup(){
        return "signup";
    }


    @GetMapping("/my-records")
    public String userPage() {
        return "my-records";  // src/main/resources/templates/my-records.html
    }
}
